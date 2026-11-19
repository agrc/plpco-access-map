import type FeatureLayer from '@arcgis/core/layers/FeatureLayer';
import type GraphicsLayer from '@arcgis/core/layers/GraphicsLayer';
import type { ArcgisFeature } from '@arcgis/map-components/components/arcgis-feature';
import type { ArcgisMap } from '@arcgis/map-components/components/arcgis-map';
import type { ArcgisSearch } from '@arcgis/map-components/components/arcgis-search';
import { expect, otherRoad, road, test } from './searchFixture';

test('uses only web map layer sources and explains the searchable road fields', async ({ page }) => {
  await page.goto('/');
  const search = page.locator('arcgis-search');
  await expect(search).toBeVisible({ timeout: 60_000 });
  await expect.poll(() => search.evaluate((element: ArcgisSearch) => element.state), { timeout: 60_000 }).toBe('ready');
  await expect
    .poll(() =>
      search.evaluate((element: ArcgisSearch) =>
        element.allSources.toArray().flatMap((source) =>
          'displayField' in source && source.displayField ? [source.displayField] : [],
        ),
      ),
    )
    .toEqual(['CO_Unique', 'S_Name', 'rd_id']);
  await expect
    .poll(() =>
      search.evaluate((element: ArcgisSearch) => element.allSources.toArray().map((source) => 'layer' in source)),
    )
    .toEqual([true, true, true]);
  await expect(search.getByRole('searchbox')).toHaveAttribute(
    'placeholder',
    'Road name, road ID, or county unique number',
  );
});

test('selecting a later search result uses that road rather than the first query result', async ({ page }) => {
  await page.goto('/');
  const map = page.locator('arcgis-map');
  await expect.poll(() => map.evaluate((element: ArcgisMap) => element.view?.ready), { timeout: 60_000 }).toBe(true);
  await expect
    .poll(() =>
      page.locator('.feature > arcgis-feature').evaluate((element: ArcgisFeature) => Boolean(element.spatialReference)),
    )
    .toBe(true);

  await page.getByRole('button', { name: 'Hide road details panel' }).click();
  const search = page.locator('arcgis-search');
  await search.evaluate(async (element: ArcgisSearch) => {
    const layer = element.view?.map?.layers.find((layer) => layer.title === 'RS2477 Centerlines') as FeatureLayer;
    const { features } = await layer.queryFeatures({ where: '1=1', outFields: ['*'], returnGeometry: true });
    const results = features.map((feature) => ({ feature, target: feature, name: feature.attributes.S_Name }));
    element.searchTerm = 'Canyon';
    element.dispatchEvent(
      new CustomEvent('arcgisSearchComplete', {
        detail: { results: [{ source: { layer }, results }], numResults: results.length },
      }),
    );
  });
  await expect(page).not.toHaveURL(/#rdid=/);
  await expect(page.locator('#app-sidebar')).not.toHaveClass(/\bopen\b/);

  await search.evaluate(async (element: ArcgisSearch, roadId) => {
    const layer = element.view?.map?.layers.find((layer) => layer.title === 'RS2477 Centerlines') as FeatureLayer;
    const { features } = await layer.queryFeatures({ where: '1=1', outFields: ['*'], returnGeometry: true });
    const feature = features.find((feature) => feature.attributes.rd_id === roadId);
    if (!feature) throw new Error('Expected the non-first road in the search results.');
    element.dispatchEvent(
      new CustomEvent('arcgisSelectResult', {
        detail: { result: { feature, target: feature, name: feature.attributes.S_Name }, source: { layer } },
      }),
    );
  }, otherRoad.rd_id);

  await expect(page).toHaveURL(new RegExp(`#rdid=${otherRoad.rd_id}$`));
  await expect(page.locator('#app-sidebar')).toHaveClass(/\bopen\b/);
  await expect(page.locator('.feature')).toContainText(otherRoad.S_Name);
  await expect.poll(() => search.evaluate((element: ArcgisSearch) => element.searchTerm)).toBe('Canyon');
  await expect
    .poll(() =>
      map.evaluate((element: ArcgisMap) => {
        const layer = element.map?.layers.find((layer) => layer.title === 'Selected road highlight') as
          GraphicsLayer | undefined;
        return layer?.graphics.length ?? 0;
      }),
    )
    .toBe(1);
});

for (const field of ['rd_id', 'CO_Unique'] as const) {
  test(`searching by ${field} selects the road and updates its shareable URL`, async ({ page }) => {
    await page.goto('/');
    const search = page.locator('arcgis-search');
    await expect
      .poll(() => search.evaluate((element: ArcgisSearch) => element.state), { timeout: 60_000 })
      .toBe('ready');
    await page.getByRole('button', { name: 'Hide road details panel' }).click();
    const input = search.getByRole('searchbox');
    await input.fill(road[field]);
    await input.press('Enter');
    await expect(page).toHaveURL(/#rdid=RD010015$/);
    await expect(page.locator('#app-sidebar')).toHaveClass(/\bopen\b/);
    await expect(page.locator('.feature')).toContainText(road.S_Name);
  });
}

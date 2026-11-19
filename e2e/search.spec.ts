import type { ArcgisSearch } from '@arcgis/map-components/components/arcgis-search';
import { expect, road, test } from './searchFixture';

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

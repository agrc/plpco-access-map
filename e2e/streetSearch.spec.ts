import type { ArcgisFeature } from '@arcgis/map-components/components/arcgis-feature/customElement';
import type { ArcgisMap } from '@arcgis/map-components/components/arcgis-map';
import type { ArcgisSearch } from '@arcgis/map-components/components/arcgis-search';
import { expect, test } from './searchFixture';

test('native search displays street matches and selects the road on the map and in the sidebar', async ({ page }) => {
  await page.goto('/');

  const searchElement = page.locator('arcgis-search');
  const search = searchElement.getByRole('combobox');
  await expect(search).toBeVisible({ timeout: 60_000 });
  await expect
    .poll(() => searchElement.evaluate((element: ArcgisSearch) => element.state))
    .toBe('ready');

  const initialScale = await page.locator('arcgis-map').evaluate((element: ArcgisMap) => element.view.scale);

  await page.getByRole('button', { name: 'Hide road details panel' }).click();
  const searchResponse = page.waitForResponse((response) => {
    const url = new URL(response.url());
    return url.pathname.endsWith('/query') && (url.searchParams.get('where') ?? '').includes('%elephant canyon%');
  });
  await search.fill('elephant canyon');
  const response = await searchResponse;
  expect(response.ok()).toBe(true);
  expect((await response.json()).features.length).toBeGreaterThan(0);

  const streetName = 'Elephant Canyon Road';
  const match = searchElement.getByRole('option').filter({ hasText: streetName }).first();
  await expect(match).toBeVisible();
  await match.click();

  await expect(page.locator('#app-sidebar')).toHaveClass(/\bopen\b/);
  await expect(page).toHaveURL(/#rdid=RD010015$/);
  await expect
    .poll(() =>
      page
        .locator('.feature > arcgis-feature')
        .evaluate((element: ArcgisFeature) => element.graphic?.attributes.S_Name),
    )
    .toBe(streetName);
  await expect(page.locator('.feature')).toContainText(streetName);

  await expect
    .poll(() =>
      page.locator('arcgis-map').evaluate((element: ArcgisMap, startingScale) => {
        const view = element.view;
        const graphic = document.querySelector<ArcgisFeature>('.feature > arcgis-feature')?.graphic;
        return {
          zoomedIn: view.scale < startingScale / 10,
          containsRoadCenter: graphic?.geometry?.extent ? view.extent.contains(graphic.geometry.extent.center) : false,
          stationary: view.stationary,
        };
      }, initialScale),
    )
    .toEqual({ zoomedIn: true, containsRoadCenter: true, stationary: true });
});

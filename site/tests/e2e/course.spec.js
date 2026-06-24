import { test, expect } from '@playwright/test';

const LESSON_SLUG = '01.01-internet-vs-web';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test('abre deep link, conclui e persiste aula', async ({ page }) => {
  await page.goto(`/?fase=fase-1&aula=${LESSON_SLUG}`);

  const reader = page.getByRole('dialog');
  await expect(reader.locator('#lesson-title')).toContainText('Internet vs Web');
  await page.getByRole('button', { name: 'Marcar como concluída' }).click();
  await page.reload();

  await expect(page.getByRole('button', { name: /Concluída/ })).toBeVisible();
});

test('busca sem acentos e abre resultado', async ({ page }) => {
  await page.getByRole('button', { name: 'Buscar' }).click();
  await page.getByRole('searchbox').fill('metacognicao');
  await page.getByRole('button', { name: /Metacognição/ }).click();

  const reader = page.getByRole('dialog', { name: /Metacognição/ });
  await expect(reader).toBeVisible();
  await expect(reader).toContainText('Metacognição');
});

test('exporta e importa backup', async ({ page }) => {
  await page.goto(`/?fase=fase-1&aula=${LESSON_SLUG}`);
  await page.getByRole('button', { name: 'Marcar como concluída' }).click();
  await page.getByRole('button', { name: 'Fechar conteúdo' }).click();
  await page.getByRole('button', { name: 'Progresso' }).click();

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Exportar JSON' }).click();
  const download = await downloadPromise;
  const backupPath = await download.path();

  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'Limpar progresso' }).click();
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByLabel('Importar backup').setInputFiles(backupPath);

  await expect(page.locator('#toast')).toContainText('Progresso importado');
  await page.getByRole('button', { name: 'Fechar' }).click();
  await page.goto(`/?fase=fase-1&aula=${LESSON_SLUG}`);
  await expect(page.getByRole('button', { name: /Concluída/ })).toBeVisible();
});

test('opera o leitor por teclado e devolve foco', async ({ page }) => {
  const firstModule = page.locator('[data-module-id]').first();
  await firstModule.locator('summary').focus();
  await page.keyboard.press('Enter');
  await expect(firstModule).toHaveAttribute('open', '');

  const firstLesson = page.locator('[data-lesson-slug]').first();
  await firstLesson.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog', { name: /Introdução e visão geral/ })).toBeVisible();

  await page.keyboard.press('Escape');
  await expect(firstLesson).toBeFocused();
});

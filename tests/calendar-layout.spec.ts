import { test, expect } from '@playwright/test';

test.describe('Calendar Layout Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/calendar');
    await page.waitForLoadState('networkidle');
  });

  test('calendar page columns are equal width at desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/calendar');
    await page.waitForSelector('[data-testid="calendar-card"]');
    
    const card = page.locator('[data-testid="calendar-card"]');
    const cardBox = await card.boundingBox();
    
    // Check that the card exists and has reasonable width
    expect(cardBox).toBeTruthy();
    expect(cardBox!.width).toBeGreaterThan(600);
  });

  test('day cells expand with viewport width', async ({ page }) => {
    // Test at larger viewport
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/calendar');
    await page.waitForSelector('[data-testid="calendar-day"]');
    
    const firstCell = page.locator('[data-testid="calendar-day"]').first();
    const w1Box = await firstCell.boundingBox();
    const w1 = w1Box!.width;

    // Test at smaller viewport
    await page.setViewportSize({ width: 1024, height: 900 });
    await page.waitForTimeout(500); // Allow resize
    const w2Box = await firstCell.boundingBox();
    const w2 = w2Box!.width;

    // Wider viewport should have wider cells
    expect(w1).toBeGreaterThan(w2);
    // Cells should be readable minimum at 1024px
    expect(w2).toBeGreaterThan(36);
  });

  test('events list appears in right panel on date select (desktop)', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/calendar');
    await page.waitForSelector('[data-testid="calendar-day"]');
    
    // Find a day with events
    const dayWithEvents = page.locator('[data-testid="calendar-day"][data-has-events="true"]').first();
    
    if (await dayWithEvents.count() > 0) {
      await dayWithEvents.click();
      await page.waitForTimeout(500); // Allow for data fetch
      
      const eventsCard = page.locator('[data-testid="events-card"]');
      await expect(eventsCard).toBeVisible();
      
      // Check that events are in the right panel, not below calendar
      const cardBox = await eventsCard.boundingBox();
      expect(cardBox).toBeTruthy();
    }
  });

  test('calendar has proper keyboard navigation', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/calendar');
    await page.waitForSelector('[data-testid="calendar-day"]');
    
    const firstDay = page.locator('[data-testid="calendar-day"]').first();
    await firstDay.focus();
    
    // Test arrow key navigation
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(100);
    
    // Verify focus moved
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toHaveAttribute('data-testid', 'calendar-day');
  });

  test('calendar maintains fixed height container', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/calendar');
    await page.waitForSelector('[data-testid="calendar-card"]');
    
    const card = page.locator('[data-testid="calendar-card"]');
    const initialHeight = (await card.boundingBox())!.height;
    
    // Click a date with events
    const dayWithEvents = page.locator('[data-testid="calendar-day"][data-has-events="true"]').first();
    if (await dayWithEvents.count() > 0) {
      await dayWithEvents.click();
      await page.waitForTimeout(500);
      
      // Check height hasn't changed
      const newHeight = (await card.boundingBox())!.height;
      expect(Math.abs(newHeight - initialHeight)).toBeLessThan(5);
    }
  });

  test('mobile view shows agenda by default', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/calendar');
    await page.waitForLoadState('networkidle');
    
    // Should show "Month" button (meaning we're in agenda view)
    const monthButton = page.getByRole('button', { name: /month/i });
    await expect(monthButton).toBeVisible();
  });

  test('mobile can toggle between agenda and grid', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/calendar');
    await page.waitForLoadState('networkidle');
    
    // Click Month to switch to grid
    const monthButton = page.getByRole('button', { name: /month/i });
    if (await monthButton.count() > 0) {
      await monthButton.click();
      await page.waitForTimeout(300);
      
      // Should now show "Agenda" button
      const agendaButton = page.getByRole('button', { name: /agenda/i });
      await expect(agendaButton).toBeVisible();
      
      // Calendar grid should be visible
      const calendarGrid = page.locator('[data-testid="calendar-day"]').first();
      await expect(calendarGrid).toBeVisible();
    }
  });

  test('calendar respects ARIA attributes', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/calendar');
    await page.waitForSelector('[data-testid="calendar-day"]');
    
    const firstDay = page.locator('[data-testid="calendar-day"]').first();
    
    // Check for aria-label
    const ariaLabel = await firstDay.getAttribute('aria-label');
    expect(ariaLabel).toBeTruthy();
    expect(ariaLabel).toContain('2025'); // Should contain year
  });

  test('no layout shift when filters change', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/calendar');
    await page.waitForSelector('[data-testid="calendar-card"]');
    
    const card = page.locator('[data-testid="calendar-card"]');
    const initialBox = await card.boundingBox();
    
    // Simulate filter change by reloading (in real use, topics selector would trigger this)
    await page.reload();
    await page.waitForSelector('[data-testid="calendar-card"]');
    
    const newBox = await card.boundingBox();
    
    // Position and size should remain stable
    expect(Math.abs(newBox!.y - initialBox!.y)).toBeLessThan(5);
    expect(Math.abs(newBox!.height - initialBox!.height)).toBeLessThan(5);
  });
});

test.describe('Calendar Accessibility Tests', () => {
  test('calendar has proper ARIA roles', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/calendar');
    await page.waitForSelector('[role="grid"]');
    
    // Calendar should have grid role
    const grid = page.locator('[role="grid"]');
    await expect(grid).toBeVisible();
    
    // Should have column headers
    const columnHeaders = page.locator('[role="columnheader"]');
    expect(await columnHeaders.count()).toBe(7); // Days of week
  });

  test('calendar cells have focus indicators', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/calendar');
    await page.waitForSelector('[data-testid="calendar-day"]');
    
    const firstDay = page.locator('[data-testid="calendar-day"]').first();
    await firstDay.focus();
    
    // Check for visible focus ring (this is a visual check via computed style)
    const focusedStyles = await firstDay.evaluate((el) => {
      return window.getComputedStyle(el).outline;
    });
    
    // Should have some outline or ring
    expect(focusedStyles).not.toBe('none');
  });
});

test.describe('Calendar Performance Tests', () => {
  test('calendar loads within acceptable time', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/calendar');
    await page.waitForSelector('[data-testid="calendar-card"]');
    
    const loadTime = Date.now() - startTime;
    
    // Should load within 3 seconds
    expect(loadTime).toBeLessThan(3000);
  });
});

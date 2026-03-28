import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log("🚀 Starting Scraper: Target - 'See all' Button with Scroll Fix...");

  try {
    await page.goto("https://www.magicbricks.com/builders-in-ghaziabad", { 
      waitUntil: 'domcontentloaded', timeout: 60000 
    });

    await page.waitForSelector('.builder__name', { timeout: 15000 });

    const builders = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('.builder__details')).map(container => {
        const nameEl = container.querySelector('.builder__name a');
        return { name: nameEl?.innerText.trim(), link: nameEl?.href };
      }).filter(b => b.name && b.link);
    });

    console.log(`✅ Found ${builders.length} Builders.`);

    const finalData = [];

    for (let i = 0; i < builders.length; i++) {
      const builder = builders[i];
      if (page.isClosed()) break;

      console.log(`\n[${i + 1}/${builders.length}] Opening: ${builder.name}`);

      try {
        await page.goto(builder.link, { waitUntil: 'domcontentloaded', timeout: 60000 });
        
        // 🎯 STEP 1: Thoda niche scroll karo taaki button load ho jaye
        await page.mouse.wheel(0, 600); 
        await page.waitForTimeout(3000);

        // 🎯 STEP 2: Exact Button Locator with Text Filter
        const seeAllBtn = page.locator('button.card__CTA-see-all').filter({ hasText: /See all/i }).first();

        if (await seeAllBtn.count() > 0) {
          console.log("Found 'See all' button. Extracting Link...");
          
          // Button ko view mein lao (Zaroori hai!)
          await seeAllBtn.scrollIntoViewIfNeeded();

          const onclickAttr = await seeAllBtn.getAttribute('onclick');
          // Regex to extract URL inside openURL('...')
          const urlMatch = onclickAttr ? onclickAttr.match(/'([^']+)'/) : null;
          const projectUrl = urlMatch ? urlMatch[1] : null;

          if (projectUrl && projectUrl.startsWith('http')) {
            console.log(`🔗 Navigating to projects page...`);
            await page.goto(projectUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
            await page.waitForTimeout(3000);
            
            await autoScroll(page);

            const projects = await page.evaluate((bName) => {
              const results = [];
              const cards = document.querySelectorAll('.srpBlockTopRow');
              cards.forEach(card => {
                const pName = card.querySelector('.proHeading strong')?.innerText?.trim();
                const pLoc = card.querySelector('.proGroup')?.innerText?.trim();
                const pPrice = card.querySelector('.proPriceField')?.innerText?.trim();
                if (pName) {
                  results.push({
                    Builder: bName,
                    ProjectName: pName,
                    Location: pLoc || "Ghaziabad",
                    Price: pPrice || "TBD"
                  });
                }
              });
              return results;
            }, builder.name);

            console.log(`📈 Success! Extracted ${projects.length} projects.`);
            finalData.push(...projects);
          }
        } else {
          console.log("⚠️ Button 'See all' nahi mili. Shayad builder ke projects listed nahi hain.");
        }

      } catch (err) {
        console.log(`❌ Error: ${err.message.split('\n')[0]}`);
      }
    }

    console.log("\n--- FINAL DATA ---");
    console.table(finalData);

  } catch (error) {
    console.error("Main Error:", error.message);
  } finally {
    console.log("Done! Browser closing in 30s...");
    await page.waitForTimeout(30000);
    await browser.close();
  }
})();

async function autoScroll(page) {
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let totalHeight = 0;
      let distance = 500;
      let timer = setInterval(() => {
        let scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;
        if (totalHeight >= scrollHeight) { clearInterval(timer); resolve(); }
      }, 400);
    });
  });
}
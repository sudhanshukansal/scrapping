// import { chromium } from 'playwright';

// (async () => {
//   const browser = await chromium.launch({ headless: false });
//   const context = await browser.newContext();
//   const page = await context.newPage();

//   console.log("Starting Scraper with Stronger Click Logic...");

//   try {
//     await page.goto("https://www.magicbricks.com/builders-in-ghaziabad", { 
//       waitUntil: 'domcontentloaded', timeout: 60000 
//     });

//     await page.waitForSelector('.builder__name', { timeout: 15000 });

//     const builders = await page.evaluate(() => {
//       return Array.from(document.querySelectorAll('.builder__details')).map(container => {
//         const nameEl = container.querySelector('.builder__name a');
//         return { name: nameEl?.innerText.trim(), link: nameEl?.href };
//       }).filter(b => b.name && b.link);
//     });

//     console.log(`✅ Found ${builders.length} Builders.`);

//     const finalData = [];

//     for (let i = 0; i < builders.length; i++) {
//       const builder = builders[i];
//       console.log(`\n[${i + 1}/${builders.length}] Opening Profile: ${builder.name}`);

//       try {
//         await page.goto(builder.link, { waitUntil: 'domcontentloaded', timeout: 60000 });
//         await page.waitForTimeout(4000);

//         // --- 🎯 RE-ENGINEERED CLICK LOGIC ---
//         // Hum "Total Projects" text dhoond rahe hain chahe wo div, a, ya span mein ho
//         const totalProjectsBtn = page.locator('text=/Total Projects/i').first();

//         if (await totalProjectsBtn.isVisible()) {
//           console.log("Found 'Total Projects'. Clicking now...");
//           // Normal click na chale toh dispatchEvent use karenge
//           await totalProjectsBtn.click({ force: true, timeout: 5000 }).catch(async () => {
//             await totalProjectsBtn.evaluate(node => node.click());
//           });
          
//           // Wait for the specific card class you found in console
//           await page.waitForSelector('.srpBlockTopRow', { timeout: 15000 }).catch(() => {
//             console.log("Waiting for project list to load...");
//           });
//         } else {
//           console.log("Widget not found, trying fallback link...");
//           await page.locator('a[href*="projects"]').first().click({ force: true }).catch(() => {});
//         }

//         await page.waitForTimeout(4000);
//         await autoScroll(page);

//         // 🎯 EXTRACTION (Using your Console HTML)
//         const projects = await page.evaluate((bName) => {
//           const results = [];
//           const cards = document.querySelectorAll('.srpBlockTopRow');
          
//           cards.forEach(card => {
//             const pName = card.querySelector('.proHeading strong')?.innerText?.trim();
//             const pLoc = card.querySelector('.proGroup')?.innerText?.trim();
//             const pPrice = card.querySelector('.proPriceField')?.innerText?.trim();
            
//             // Property Type and Area from Description
//             const description = card.closest('.srpColm2')?.innerText || "";
//             let pType = "Residential";
//             if (description.includes("BHK")) {
//                 const bhkMatch = description.match(/\d\s?BHK/i);
//                 pType = bhkMatch ? bhkMatch[0] : "Apartment";
//             }

//             if (pName) {
//               results.push({
//                 Builder: bName,
//                 ProjectName: pName,
//                 Location: pLoc?.replace('by', '')?.trim() || "Ghaziabad",
//                 Price: pPrice || "TBD",
//                 Type: pType
//               });
//             }
//           });
//           return results;
//         }, builder.name);

//         if (projects.length > 0) {
//           console.log(`📈 Success! Found ${projects.length} projects.`);
//           finalData.push(...projects);
//         } else {
//           console.log("⚠️ No projects extracted. Check if page loaded correctly.");
//         }

//       } catch (err) {
//         console.log(`❌ Error at ${builder.name}: ${err.message}`);
//       }
//     }

//     console.log("\n--- FINAL DATA ---");
//     console.table(finalData);

//   } catch (error) {
//     console.error("Main Error:", error.message);
//   } finally {
//     console.log("Closing in 20 seconds...");
//     await page.waitForTimeout(20000);
//     await browser.close();
//   }
// })();

// async function autoScroll(page) {
//   await page.evaluate(async () => {
//     await new Promise((resolve) => {
//       let totalHeight = 0;
//       let distance = 400;
//       let timer = setInterval(() => {
//         let scrollHeight = document.body.scrollHeight;
//         window.scrollBy(0, distance);
//         totalHeight += distance;
//         if (totalHeight >= scrollHeight) { clearInterval(timer); resolve(); }
//       }, 300);
//     });
//   });
// }

import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log("Starting Scraper... Target: 'See all Projects' Button");

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
      console.log(`\n[${i + 1}/${builders.length}] Processing: ${builder.name}`);

      try {
        await page.goto(builder.link, { waitUntil: 'domcontentloaded', timeout: 60000 });
        await page.waitForTimeout(4000);

        // --- 🎯 NEW BUTTON CLICK LOGIC ---
        // Hum specifically "See all" text wali button dhoond rahe hain
        const seeAllButton = page.locator('button.card__CTA-see-all, .card__CTA-see-all').first();

        if (await seeAllButton.isVisible()) {
          const btnText = await seeAllButton.innerText();
          console.log(`Found Button: "${btnText}". Clicking now...`);
          
          // Click with force and fallback to evaluate click
          await seeAllButton.click({ force: true }).catch(async () => {
            await seeAllButton.evaluate(node => node.click());
          });

          // Wait for the project list page to load (aapki console class)
          await page.waitForSelector('.srpBlockTopRow', { timeout: 15000 }).catch(() => {
             console.log("Waiting for projects to appear...");
          });
        } else {
          console.log("⚠️ 'See all' button not found. Trying fallback regex...");
          await page.locator('button:has-text("See all"), a:has-text("See all")').first().click({ force: true }).catch(() => {});
        }

        await page.waitForTimeout(4000);
        await autoScroll(page);

        // 🎯 EXTRACTION LOGIC
        const projects = await page.evaluate((bName) => {
          const results = [];
          const cards = document.querySelectorAll('.srpBlockTopRow');
          
          cards.forEach(card => {
            const pName = card.querySelector('.proHeading strong')?.innerText?.trim();
            const pLoc = card.querySelector('.proGroup')?.innerText?.trim();
            const pPrice = card.querySelector('.proPriceField')?.innerText?.trim();
            
            const description = card.closest('.srpColm2')?.innerText || "";
            let pType = "Residential";
            if (description.includes("BHK")) {
                const bhkMatch = description.match(/\d\s?BHK/i);
                pType = bhkMatch ? bhkMatch[0] : "Apartment";
            }

            if (pName) {
              results.push({
                Builder: bName,
                ProjectName: pName,
                Location: pLoc?.replace(/by\s+.*in\s+/i, '').trim() || "Ghaziabad",
                Price: pPrice || "TBD",
                Type: pType
              });
            }
          });
          return results;
        }, builder.name);

        if (projects.length > 0) {
          console.log(`📈 Success! Found ${projects.length} projects.`);
          finalData.push(...projects);
        } else {
          console.log("⚠️ No projects found on the list page.");
        }

      } catch (err) {
        console.log(`❌ Error processing ${builder.name}: ${err.message}`);
      }
    }

    console.log("\n--- SCRAPING COMPLETED ---");
    console.table(finalData);

  } catch (error) {
    console.error("Main Error:", error.message);
  } finally {
    console.log("Scraper finished. Closing in 20s...");
    await page.waitForTimeout(20000);
    await browser.close();
  }
})();

async function autoScroll(page) {
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let totalHeight = 0;
      let distance = 400;
      let timer = setInterval(() => {
        let scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;
        if (totalHeight >= scrollHeight) { clearInterval(timer); resolve(); }
      }, 300);
    });
  });
}
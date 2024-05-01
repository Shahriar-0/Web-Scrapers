const { chromium } = require('playwright');
const fs = require('fs');
const cliProgress = require('cli-progress');

async function run() {
    const browser = await chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();

    let leaguesCSVContent = "League,Teams\n";

    const multibar = new cliProgress.MultiBar([
        {
            format: '{title} |{bar}| {percentage}% || {value}/{total}',
            barCompleteChar: '\u2588',
            barIncompleteChar: '\u2591',
            hideCursor: true,
            title: 'leagues'
        },
        {
            format: '{title} |{bar}| {percentage}% || {value}/{total}',
            barCompleteChar: '\u2588',
            barIncompleteChar: '\u2591',
            hideCursor: true,
            title: 'teams'
        }
    ], cliProgress.Presets.shades_classic);


    let leaguesLinks = [
        "https://www.besoccer.com/competition/teams/primera_division",
        "https://www.besoccer.com/competition/teams/premier_league",
        "https://www.besoccer.com/competition/teams/bundesliga",
        "https://www.besoccer.com/competition/teams/ligue_1",
        "https://www.besoccer.com/competition/teams/serie_a"
    ];

    const leaguesBar = multibar.create(leaguesLinks.length, 0);
    const teamsBar = multibar.create(20, 0);

    for (var j = 0; j < leaguesLinks.length; j++) {
        let csvContent = "Team,Goalkeepers,Defenders,Midfielder,Forwards\n";
        await page.goto(leaguesLinks[j], { timeout: 120000 });
        let leagueName = leaguesLinks[j].substring(leaguesLinks[j].lastIndexOf("/") + 1);
        leaguesCSVContent += leagueName + ","

        let links = await page.evaluate(() => {
            let links = [];
            var itemBoxes = document.querySelectorAll(".item-box");
            for (var i = 0; i < itemBoxes.length; i++) {
                var hrefValue = itemBoxes[i].querySelector("a").getAttribute("href");
                links.push(hrefValue.replace(/team/g, "team/squad"));
            }
            return links;
        });

        teamsBar.setTotal(links.length);
        teamsBar.start(links.length, 0);

        for (let i = 0; i < links.length; i++) {
            await page.goto(links[i], { timeout: 120000 });

            let newRow = ["", "", "", ""];
            let rows = await page.$$("#team_performance tr.row-body");

            for (let j = 0; j < rows.length; j++) {
                let row = rows[j];
                let jobTitle = await row.$eval("script", el => el.innerHTML.match(/"jobTitle":\s"(\w+)"/)[1]);
                switch (jobTitle) {
                    case "Goalkeeper":
                        newRow[0] += await row.$eval("td.name", el => el.innerText) + ";";
                        break;
                    case "Defender":
                        newRow[1] += await row.$eval("td.name", el => el.innerText) + ";";
                        break;
                    case "Midfielder":
                        newRow[2] += await row.$eval("td.name", el => el.innerText) + ";";
                        break;
                    case "Forward":
                        newRow[3] += await row.$eval("td.name", el => el.innerText) + ";";
                        break;
                }
            }
            let teamName = await page.$eval(".head-title .title.ta-c", el => el.innerHTML);
            csvContent += teamName + "," + newRow.join(",").replace(/;,/g, ",") + "\n";
            leaguesCSVContent += teamName + ((i == leaguesLinks.length - 1) ? "\n" : ";");
            teamsBar.update(i + 1);
        }

        fs.writeFileSync(leagueName + ".csv", csvContent);
        leaguesBar.update(j + 1);
    }

    fs.writeFileSync("leagues.csv", leaguesCSVContent)

    multibar.stop();
    await browser.close();
}

run();

/* 
Thank you Reis, the Original Author of
Priscilu, and allowing CilginDalgic to
eventually take over, ideally making
it what it is today.

Thank you both for your hard work and
dedication to this mod. I hope I've
only made it better.

Reis: https://hub.sp-tarkov.com/user/2833-reis/
CilginDalgic: https://hub.sp-tarkov.com/user/50948-cilgindalgic/

------------------------------------------

Thank you AcidPhantasm for allowing me
to snag a *few* snippets of code
from his trader, Scorpion!

Be sure to check out his mods here:
https://hub.sp-tarkov.com/files/user-file-list/51352-acidphantasm/



----------------------------------------------------

Updates:

- Updated Trader ID to MongoID
- Updated Prices of all items
- Added Loading Messages
- Added Ability to make stock unlimited
- Added Ability to make stock randomized
- Added priceMultiplier Function
- Updated Custom Items to MongoIDs
- Updated tasks to match new Trader ID
- Updated Trader Picture to match new Trader ID
- Added Insurance Messages
- Updated Repair and Insurance Prices
- Updated locales (en) for Priscilu Tasks
- Updated *some* rewards for Priscilu Tasks
- Updated Tasks to have MongoIDs
- Updated Priscilu Trader Picture
- Added New / Updated Quest Images

----------------------------------------------------

*/

/* eslint-disable no-mixed-spaces-and-tabs */
import { DependencyContainer, container } from "tsyringe";
import { IPreSptLoadMod } from "@spt/models/external/IPreSptLoadMod";
import { IPostDBLoadMod } from "@spt/models/external/IPostDBLoadMod";
import { ILogger } from "@spt/models/spt/utils/ILogger";
import { LogTextColor } from "@spt/models/spt/logging/LogTextColor";
import { PreSptModLoader } from "@spt/loaders/PreSptModLoader";
import { ImageRouter } from "@spt/routers/ImageRouter";
import { ConfigServer } from "@spt/servers/ConfigServer";
import { ConfigTypes } from "@spt/models/enums/ConfigTypes";
import { ITraderConfig } from "@spt/models/spt/config/ITraderConfig";
import { IRagfairConfig } from "@spt/models/spt/config/IRagfairConfig";
import { JsonUtil } from "@spt/utils/JsonUtil";
import { Traders } from "@spt/models/enums/Traders";
import { ImporterUtil } from "@spt/utils/ImporterUtil";
import { RandomUtil } from "@spt/utils/RandomUtil";
import { ConfigsModelBase } from "./model/ConfigsModel";
import { ILocaleGlobalBase } from "@spt/models/spt/server/ILocaleBase";
import type { DynamicRouterModService } from "@spt/services/mod/dynamicRouter/DynamicRouterModService";
import { DatabaseService } from "@spt/services/DatabaseService";
import { IDatabaseTables } from "@spt/models/spt/server/IDatabaseTables"
import { PrisciluHelper } from "./prisciluHelper";
import { VFS } from "@spt/utils/VFS";
import { jsonc } from "jsonc";

import baseJson from "../db/assort/Priscilu/base.json";
import assortJson from "../db/assort/Priscilu/assort.json";
import dialogues = require("../db/assort/Priscilu/dialogue.json");
import questAssort from "../db/assort/Priscilu/questassort.json"

import path from "node:path";

let realismDetected: boolean;
// Priscilu Random Messages
const loadMessage = {

    1: "Priscilu has successfully loaded, take it slow!",
    2: "Loaded and ready! The Priscilu is now at your service.",
    3: "Patience is a virtue: Priscilu has fully loaded.",
    4: "Slow and steady wins the race! Priscilu has loaded.",
    5: "Priscilu is loaded—time to embrace the chill!",
    6: "Sloth speed ahead: loading complete!",
    7: "Ready to go at sloth pace: your content has loaded!",
    8: "Take a deep breath; Priscilu has finally loaded!",
    9: "All set and loaded—enjoy the leisurely vibes of the sloth!",
    10: "Priscilu is loaded; let’s savor the moment!",
    11: "Priscilu has successfully loaded, ready to take on the world at its own pace!",
    12: "Good news! Priscilu is loaded and looking for a comfy branch to chill on.",
    13: "Priscilu has loaded! Slow and steady wins the race.",
    14: "Alert: Priscilu has fully loaded and is now embracing the art of relaxation.",
    15: "Priscilu status: loaded and ready for some serious lounging.",
    16: "Priscilu has loaded – let the snacking commence!",
    17: "Priscilu is loaded! Prepare for some leisurely adventures.",
    18: "Loading complete: Priscilu is now in zen mode.",
    19: "The sloth has loaded! Time to take it easy and enjoy the view.",
    20: "Update: Priscilu has loaded, and it’s officially naptime!"
}

class Priscilu implements IPreSptLoadMod, IPostDBLoadMod {

    public mod: string;
    public logger: ILogger;
    public tables: IDatabaseTables
    private prisciluHelper: PrisciluHelper;

    private static vfs = container.resolve<VFS>("VFS");
    private static config: Config = jsonc.parse(Priscilu.vfs.readFile(path.resolve(__dirname, "../config/config.json")));

    constructor() {
        this.mod = "Priscilu";
    }

    // Perform these actions before server fully loads
    public preSptLoad(container: DependencyContainer): void {

        const dynamicRouterModService = container.resolve<DynamicRouterModService>("DynamicRouterModService");
        const databaseService: DatabaseService = container.resolve<DatabaseService>("DatabaseService");
        const preSptModLoader: PreSptModLoader = container.resolve<PreSptModLoader>("PreSptModLoader");
        const imageRouter: ImageRouter = container.resolve<ImageRouter>("ImageRouter");
        const configServer = container.resolve<ConfigServer>("ConfigServer");
        const traderConfig: ITraderConfig = configServer.getConfig<ITraderConfig>(ConfigTypes.TRADER);
        const ragfairConfig = configServer.getConfig<IRagfairConfig>(ConfigTypes.RAGFAIR);

        this.logger = container.resolve<ILogger>("WinstonLogger");

        let minRefresh = Priscilu.config.traderRefreshMin;
        let maxRefresh = Priscilu.config.traderRefreshMax;
        const addToFlea = Priscilu.config.AddTradertoFleaMarket;

        // Randomized Stock
        dynamicRouterModService.registerDynamicRouter(
            "PrisciluRefreshStock",
            [
                {
                    url: "/client/items/prices/66c0d4fc713f0ea9c8e7368e",
                    action: async (url, info, sessionId, output) => {
                        const trader = databaseService.getTables().traders["66c0d4fc713f0ea9c8e7368e"];
                        const assortItems = trader.assort.items;
                        if (!realismDetected) {
                            if (Priscilu.config.randomizeStockAvailable) {
                                if (Priscilu.config.debugLogging) { this.logger.info(`[${this.mod}] Refreshing Priscilu Stock with Randomized Stock Availability.`); }
                                this.randomizeStockAvailable(assortItems);
                            }
                        }
                        return output;
                    }
                }
            ],
            "spt"
        );

        // Trader Refresh Timer
        if (minRefresh >= maxRefresh || maxRefresh <= 2) {
            minRefresh = 1800;
            maxRefresh = 3600;
            this.logger.error(`[${this.mod}] [Config Issue] Refresh timers have been reset to default.`);
        }

        this.prisciluHelper = new PrisciluHelper();
        // Set Trader Profile Image
        this.prisciluHelper.registerProfileImage(baseJson, this.mod, preSptModLoader, imageRouter, "66c0d4fc713f0ea9c8e7368e.jpg");
        // Set Trader Update Time
        this.prisciluHelper.setTraderUpdateTime(traderConfig, baseJson, minRefresh, maxRefresh);

        Traders[baseJson._id] = baseJson._id;

        // Add Trader to Flea
        if (addToFlea) {
            ragfairConfig.traders[baseJson._id] = true;
            this.logger.logWithColor(`Priscilu added to Flea!`, LogTextColor.MAGENTA);
        }
        else {
            ragfairConfig.traders[baseJson._id] = false;
            this.logger.logWithColor(`Priscilu NOT added to Flea!`, LogTextColor.MAGENTA);
        }
    }

    public postDBLoad(container: DependencyContainer): void {

        // How slow is the sloth?
        const start = performance.now();

        const databaseService: DatabaseService = container.resolve<DatabaseService>("DatabaseService");
        const configServer = container.resolve<ConfigServer>("ConfigServer");
        const jsonUtil: JsonUtil = container.resolve<JsonUtil>("JsonUtil");
        const assortPriceTable = assortJson.barter_scheme;
        const assortItemTable = assortJson.items;
        const tables = databaseService.getTables();
        const newAssort = assortJson

        if (Priscilu.config.randomizeStockAvailable) { this.randomizeStockAvailable(assortItemTable); }
        if (Priscilu.config.unlimitedStock) { this.setUnlimitedStock(assortItemTable); }
        if (Priscilu.config.priceMultiplier !== 1) { this.setPriceMultiplier(assortPriceTable); }

        // VCQL Mod Check
        const preSptModLoader: PreSptModLoader = container.resolve<PreSptModLoader>("PreSptModLoader");
        const vcqlCheck = preSptModLoader.getImportedModsNames().includes("Virtual's Custom Quest Loader");
        const realismCheck = preSptModLoader.getImportedModsNames().includes("SPT-Realism");
        if (!vcqlCheck) {
            this.logger.error(`[${this.mod}] VCQL not detected. Install VCQL and re-install ${this.mod}.`);
        }
        if (Priscilu.config.randomizeStockAvailable) {
            this.setRealismDetection(realismCheck);
        }
        else {
            this.setRealismDetection(realismCheck);
        }


        this.prisciluHelper.addTraderToDb(baseJson, tables, jsonUtil, newAssort);
        this.prisciluHelper.addTraderToLocales(baseJson, tables, baseJson.name, "66c0d4fc713f0ea9c8e7368e", baseJson.nickname, baseJson.location, "A distinguished gunsmith who smuggles some of the best weapons and equipment into Tarkov. Also he is excellent in repairing weapons and armor");
        this.prisciluHelper.addDialogues(baseJson, dialogues, tables);
        this.prisciluHelper.addQuestAssorts(baseJson, questAssort, tables);


        const importerUtil = container.resolve<ImporterUtil>("ImporterUtil");
        const modImporter = container.resolve<PreSptModLoader>("PreSptModLoader");
        const locales = Object.values(tables.locales.global) as ILocaleGlobalBase[];
        const path = modImporter.getModPath("Priscilu");

        const configPath = `${path}db/`;
        const configs = importerUtil.loadRecursive<ConfigsModelBase>(configPath);

        // Fetch Custom Items
        for (const item in configs["items"]) {
            tables.templates.items[item] = configs["items"][item];
        }

        // Fetch Custom Item Information
        for (const locale of locales) {
            for (const item in configs.locales['itemsdescription']) {
                locale[(item + " Name")] = configs.locales['itemsdescription'][item].Name
                locale[(item + " ShortName")] = configs.locales['itemsdescription'][item].ShortName
                locale[(item + " Description")] = configs.locales['itemsdescription'][item].Description
            }


            // Fetch Trader Information
            for (const description in configs.locales["Priscilu"]) {
                locale[description] = configs.locales["Priscilu"][description]
            }
        }

        // Set Insurance Return Percentage
        const insuranceConfig = container.resolve<ConfigServer>("ConfigServer").getConfig(ConfigTypes.INSURANCE)
        const traderID = [baseJson._id];
        insuranceConfig.returnChancePercent[traderID] = 80;
        if (Priscilu.config.debugLogging) { this.logger.logWithColor(`[${this.mod}] Insurance Return Percentage set to: ${insuranceConfig.returnChancePercent[traderID]}`, LogTextColor.MAGENTA); }

        // Those Random Messages you saw earlier - One pops up now.
        this.logger.logWithColor(`[${this.mod}] ${this.PrisciluLoadMessages()}`, LogTextColor.MAGENTA);

        // The Sloth is THIS slow
        const timeTaken = performance.now() - start;
        this.logger.logWithColor(`[${this.mod}] Trader took ${timeTaken.toFixed(3)}ms to load.`, LogTextColor.MAGENTA);
    }

    // This is what does that
    private PrisciluLoadMessages() {
        const value = loadMessage[Math.floor(Math.random() * Object.keys(loadMessage).length)];
        return value;
    }
    // Randomize Stock Available
    private randomizeStockAvailable(assortItemTable) {
        const randomUtil: RandomUtil = container.resolve<RandomUtil>("RandomUtil");
        if (!realismDetected) // If realism is not detected, continue, else do nothing
        {
            for (const item in assortItemTable) {
                if (assortItemTable[item].parentId !== "hideout") {
                    continue // Skip setting count, it's a weapon attachment or armour plate
                }
                const outOfStockRoll = randomUtil.getChance100(Priscilu.config.outOfStockChance);

                if (outOfStockRoll) {
                    const itemID = assortItemTable[item]._id;
                    assortItemTable[item].upd.StackObjectsCount = 0;

                    if (Priscilu.config.debugLogging) { this.logger.log(`[${this.mod}] Item: [${itemID}] Marked out of stock`, "cyan"); }
                }
                else {
                    const itemID = assortItemTable[item]._id;
                    const originalStock = assortItemTable[item].upd.StackObjectsCount;
                    const newStock = randomUtil.randInt(3, (originalStock * 2));
                    assortItemTable[item].upd.StackObjectsCount = newStock;

                    if (Priscilu.config.debugLogging) { this.logger.log(`[${this.mod}] Item: [${itemID}] Stock Count changed to: [${newStock}]`, "cyan"); }
                }

            }
            this.logger.logWithColor(`[${this.mod}] Stock Count has been updated. Enjoy!`, LogTextColor.MAGENTA);
        }

    }

    // Set Unlimited Stock
    private setUnlimitedStock(assortItemTable) {
        for (const item in assortItemTable) {
            if (assortItemTable[item].parentId !== "hideout") {
                continue // Skip setting count, it's a weapon attachment or armour plate
            }
            assortItemTable[item].upd.StackObjectsCount = 999999;
            assortItemTable[item].upd.UnlimitedCount = true;
        }
        this.logger.log(`[${this.mod}] Item stock counts are now unlimited`, "cyan");
    }

    // Detecting Realism
    private setRealismDetection(i: boolean) // Except this one. This is dumb. I'll fix it eventually.
    {
        realismDetected = i;
        if (realismDetected && Priscilu.config.randomizeStockAvailable) {
            this.logger.log(`[${this.mod}] SPT-Realism detected, disabling randomizeStockAvailable:`, "red");
        }
    }

    // Set Price Multiplier
    private setPriceMultiplier(assortPriceTable) {
        let priceMultiplier = Priscilu.config.priceMultiplier;
        if (priceMultiplier <= 0) {
            priceMultiplier = 1;
            this.logger.error(`[${this.mod}] priceMultiplier cannot be set to zero.`)
        }
        for (const itemID in assortPriceTable) {
            for (const item of assortPriceTable[itemID]) {
                if (item[0].count <= 15) {
                    if (Priscilu.config.debugLogging) { this.logger.log(`[${this.mod}] itemID: [${itemID}] No price change, it's a barter trade.`, "cyan"); }
                    continue;
                }
                const count = item[0].count;
                const newPrice = Math.round(count * priceMultiplier);
                item[0].count = newPrice
                if (Priscilu.config.debugLogging) { this.logger.log(`[${this.mod}] itemID: [${itemID}] Price Changed to: [${newPrice}]`, "cyan"); }
            }
        }
    }

// It makes stuff work
interface Config {
    tables: any;
    randomizeStockAvailable: boolean,
    outOfStockChance: number,
    traderRefreshMin: number,
    traderRefreshMax: number,
    AddTradertoFleaMarket: boolean,
    debugLogging: boolean,
    unlimitedStock: boolean,
    priceMultiplier: number
}


module.exports = { mod: new Priscilu() }

/* 

------------------
Updates (Cont.):

- Easter Egg

------------------

*/


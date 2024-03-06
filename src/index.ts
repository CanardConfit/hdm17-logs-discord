import dotenv from "dotenv";
import logAPI from "hdm17-logs-extractor";
import { LogInfo } from "hdm17-logs-extractor/dist/logInfo";
import { Embed, Webhook } from "@vermaysha/discord-webhook";
import * as process from "process";
dotenv.config();

const hook = new Webhook(process.env.DISCORD_WEBHOOK_URL);

const logWatcher = logAPI.initLogWatch(process.env.PARAGON_LOG_FILE);

logWatcher.on("lineChanged", (logInfo: LogInfo) => {
    console.log("Log changed:", logInfo);
    const embed = new Embed();
    embed.setTitle("Log changed");
    hook.addEmbed(embed).send().then();
});

logWatcher.on("error", (error) => {
    console.error("Error:", error);
});

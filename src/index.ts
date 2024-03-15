import dotenv from "dotenv";
import logAPI from "hdm17-logs-extractor";
import { JOB_BACKUP_TYPE, JOB_END_TIME, JOB_EXIT_CODE, JOB_GUID, JOB_START_TIME, LogInfo } from "hdm17-logs-extractor/dist/logInfo";
import { Embed, Webhook } from "@vermaysha/discord-webhook";
import * as process from "process";
dotenv.config();

console.log("Service starting...");

const hook = new Webhook(process.env.DISCORD_WEBHOOK_URL);

const logWatcher = logAPI.initLogWatch(process.env.PARAGON_LOG_FILE, false);

let currentJob = {
    startTime: null,
    stopTime: null,
    exitCode: -1,
    guid: null,
    archiveType: null,
};

const formatDuration = (durationMs: number): string => {
    const hours = Math.floor(durationMs / 3600000);
    const minutes = Math.floor((durationMs % 3600000) / 60000);
    const seconds = Math.floor((durationMs % 60000) / 1000);

    let result = "";

    if (hours > 0) {
        result += `${hours}h `;
    }
    if (hours > 0 || minutes > 0) {
        result += `${minutes}m `;
    }
    result += `${seconds}s`;

    return result.trim();
};

logWatcher.on("lineChanged", (logInfo: LogInfo) => {
    console.debug(logInfo);

    switch (logInfo.logType) {
        case JOB_START_TIME:
            currentJob.startTime = logInfo.logValue as Date;
            break;
        case JOB_GUID:
            currentJob.guid = logInfo.logValue as string;
            break;
        case JOB_EXIT_CODE:
            currentJob.exitCode = logInfo.logValue as number;
            break;
        case JOB_BACKUP_TYPE: {
            currentJob.archiveType = logInfo.logValue as string;
            const embed = new Embed();
            embed.setTitle(`Job Started: \`${currentJob.guid}\``);
            embed.addField({ name: "Archive Type", value: currentJob.archiveType, inline: true });
            hook.addEmbed(embed).send().then();
            break;
        }
        case JOB_END_TIME: {
            currentJob.stopTime = logInfo.logValue as Date;
            const embed = new Embed();
            embed.setTitle(`Job Finished: \`${currentJob.guid}\``);
            embed.addField({
                name: "Time",
                value: formatDuration(currentJob.stopTime - currentJob.startTime),
                inline: true,
            });
            embed.addField({ name: "Exit Code", value: `0x${currentJob.exitCode}`, inline: true });
            hook.addEmbed(embed).send().then();
            currentJob = {
                startTime: null,
                stopTime: null,
                exitCode: -1,
                guid: null,
                archiveType: null,
            };
            break;
        }
    }
});

logWatcher.on("error", (error) => {
    console.error("Error:", error);
});

logWatcher.on("firstScanFinished", () => {
    console.log("Service now started");
});

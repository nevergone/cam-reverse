import process from "node:process";
import { hideBin } from "yargs/helpers";
import yargs from "yargs/yargs";

import { captureSingle } from "../capture_single.js";
import { serveHttp } from "../http_server.js";
import { pair } from "../pair.js";
import { loadConfig, config } from "../settings.js";

import { buildLogger, logger } from "../logger.js";

const majorVersion = process.versions.node.split(".").map(Number)[0];

yargs(hideBin(process.argv))
  .command(
    "http_server",
    "start http server",
    (yargs) => {
      return yargs
        .option("color", { describe: "Use color in logs" })
        .boolean(["audio", "color"])
        .option("config_file", { describe: "Specify config file" })
        .option("log_level", { describe: "Set log level" })
        .option("discovery_ip", { describe: "Camera discovery IP address" })
        .option("port", { describe: "HTTP Port to listen on" })
        .string(["log_level", "discovery_ip", "config_file"])
        .number(["port"])
        .strict();
    },
    (argv) => {
      if (argv.config_file !== undefined) {
        loadConfig(argv.config_file);
      }
      if (argv.port) {
        config.http_server.port = argv.port;
      }
      if (argv.color !== undefined) {
        config.logging.use_color = argv.color;
      }
      if (argv.log_level !== undefined) {
        config.logging.level = argv.log_level;
      }
      if (argv.discovery_ip !== undefined) {
        config.discovery_ips = [argv.discovery_ip];
      }

      buildLogger(config.logging.level, config.logging.use_color);
      if (majorVersion < 16) {
        logger.error(`Node version ${majorVersion} is not supported, may malfunction`);
      }
      serveHttp(config.http_server.port);
    },
  )
  .command(
    "pair",
    "configure a camera",
    (yargs) => {
      return yargs
        .option("log_level", { describe: "Set log level", default: "info" })
        .option("config_file", { describe: "Specify config file" })
        .option("discovery_ip", { describe: "Camera discovery IP address" })
        .option("ssid", { describe: "Wifi network for the camera to connect to" })
        .option("password", { describe: "Wifi network password" })
        //.string(["ssid", "password"]);
        .strict();

    },
    (argv) => {

      if (argv.config_file !== undefined) {
        loadConfig(argv.config_file);
      }

      buildLogger(argv.log_level, undefined);
      if (majorVersion < 16) {
        logger.error(`Node version ${majorVersion} is not supported, may malfunction`);
      }
      // always overwrite discovery ips for pairing to prevent using existing IPs
      let pair_discovery_ips = (argv.discovery_ip !== undefined) ?
        [argv.discovery_ip] :
        ["192.168.1.255"];

      if (argv.ssid !== undefined) {
        config.ssid = argv.ssid;
      }
      if (argv.password !== undefined) {
        config.password = argv.password;
      }
      pair({ ssid: config.ssid, password: config.password, discovery_ips: pair_discovery_ips });
    },
  )
  .command(
    "frame",
    "capture a single frame from the first discovered camera",
    (yargs) => {
      return yargs
        .option("log_level", { describe: "Set log level", default: "info" })
        .option("discovery_ip", { describe: "Camera discovery IP address", default: "192.168.1.255" })
        .option("out", { describe: "Path for output file" })
        .demandOption(["out"])
        .string(["out", "discovery_ip"]);
    },
    (argv) => {
      buildLogger(argv.log_level, undefined);
      if (majorVersion < 16) {
        logger.error(`Node version ${majorVersion} is not supported, may malfunction`);
      }
      captureSingle({ discovery_ip: argv.discovery_ip, out_file: argv.out });
    },
  )
  .demandCommand()
  .parseSync();

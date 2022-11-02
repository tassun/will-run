#!/usr/bin/env node

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var KnRunner_1 = require("../runner/KnRunner");
var runner = new KnRunner_1.KnRunner();
runner.start(process.argv);

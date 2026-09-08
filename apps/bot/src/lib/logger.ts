// QuestBot: A free and open-source Discord Bot.
// Copyright(C) 2026 Vantern
// SPDX-License-Identifier: AGPL-3.0-or-later

import { format } from 'node:util';
import { logs, SeverityNumber } from '@opentelemetry/api-logs';

// Hey! We handling all of the logging here.
// That way we can easily swap out whatever system we use such as sentry, betterstack, grafana, etc. in the future.

const OTEL_LOGGER = logs.getLogger('questbot');

function emit(severityNumber: SeverityNumber, severityText: string, args: unknown[]) {
	OTEL_LOGGER.emit({ severityNumber, severityText, body: format(...args) });
}

export const logger = {
	log: (...args: unknown[]) => {
		// console.log(...args);
		emit(SeverityNumber.INFO, 'INFO', args);
	},
	warn: (...args: unknown[]) => {
		// console.warn(...args);
		emit(SeverityNumber.WARN, 'WARN', args);
	},
	error: (...args: unknown[]) => {
		// console.error(...args);
		emit(SeverityNumber.ERROR, 'ERROR', args);
	},
	debug: (...args: unknown[]) => {
		// console.debug(...args);
		emit(SeverityNumber.DEBUG, 'DEBUG', args);
	},
};

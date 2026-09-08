// QuestBot: A free and open-source Discord Bot.
// Copyright(C) 2026 Vantern
// SPDX-License-Identifier: AGPL-3.0-or-later

import process from 'node:process';

if (process.env.OTEL_EXPORTER_OTLP_ENDPOINT) {
	await import('@opentelemetry/auto-instrumentations-node/register');
}

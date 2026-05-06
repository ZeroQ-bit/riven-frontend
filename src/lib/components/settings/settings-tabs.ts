export const settingsTabs = [
    {
        id: "general",
        label: "General",
        keys: ["version", "api_key", "log_level", "retry_interval", "tracemalloc"]
    },
    {
        id: "library",
        label: "Library",
        keys: ["filesystem", "updaters", "indexer"]
    },
    {
        id: "downloaders",
        label: "Downloaders",
        keys: ["downloaders"]
    },
    {
        id: "content",
        label: "Content",
        keys: ["content", "notifications"]
    },
    {
        id: "scraping",
        label: "Scraping",
        keys: ["scraping", "ranking", "post_processing"]
    },
    {
        id: "advanced",
        label: "Advanced",
        keys: ["database", "logging", "stream", "enable_network_tracing", "enable_stream_tracing"]
    }
] as const;

export type SettingsTabId = (typeof settingsTabs)[number]["id"];

export const settingsTabById = Object.fromEntries(
    settingsTabs.map((tab) => [tab.id, tab])
) as Record<SettingsTabId, (typeof settingsTabs)[number]>;

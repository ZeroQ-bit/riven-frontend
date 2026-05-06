import type { Actions, PageServerLoad } from "./$types";
import { error, fail } from "@sveltejs/kit";
import providers from "$lib/providers";
import type { Schema } from "@sjsf/form";
import type { InitialFormData } from "@sjsf/sveltekit";
import { createFormHandler } from "@sjsf/sveltekit/server";
import * as defaults from "$lib/components/settings/form-defaults";
import {
    settingsTabById,
    settingsTabs,
    type SettingsTabId
} from "$lib/components/settings/settings-tabs";

type SettingsTabFormData = InitialFormData<Record<string, unknown>> & {
    schema: Schema;
    initialValue: Record<string, unknown>;
};

const getSchemaForTab = async (
    tabId: SettingsTabId,
    baseUrl: string,
    apiKey: string,
    fetch: typeof globalThis.fetch
): Promise<Schema> => {
    const tab = settingsTabById[tabId];
    const settingsSchema = await providers.riven.GET("/api/v1/settings/schema/keys", {
        baseUrl,
        params: {
            query: {
                keys: tab.keys.join(","),
                title: `${tab.label}Settings`
            }
        },
        headers: {
            "x-api-key": apiKey
        },
        fetch
    });

    if (settingsSchema.error) {
        throw new Error(`Failed to load ${tab.label} settings schema`);
    }

    return settingsSchema.data as Schema;
};

const pickSettings = (settings: unknown, keys: readonly string[]) => {
    const source =
        settings && typeof settings === "object" ? (settings as Record<string, unknown>) : {};

    return Object.fromEntries(
        keys.filter((key) => key in source).map((key) => [key, source[key]])
    ) as Record<string, unknown>;
};

const loadTabForm = async (
    tabId: SettingsTabId,
    settings: unknown,
    baseUrl: string,
    apiKey: string,
    fetch: typeof globalThis.fetch
): Promise<SettingsTabFormData> =>
    ({
        schema: await getSchemaForTab(tabId, baseUrl, apiKey, fetch),
        initialValue: pickSettings(settings, settingsTabById[tabId].keys)
    }) satisfies SettingsTabFormData;

export const load: PageServerLoad = async ({ fetch, locals }) => {
    const allSettings = await providers.riven.GET("/api/v1/settings/get/all", {
        baseUrl: locals.backendUrl,
        headers: {
            "x-api-key": locals.apiKey
        },
        fetch: fetch
    });

    if (allSettings.error) {
        error(500, "Failed to load settings");
    }

    const tabForms = Object.fromEntries(
        await Promise.all(
            settingsTabs.map(async (tab) => [
                tab.id,
                await loadTabForm(tab.id, allSettings.data, locals.backendUrl, locals.apiKey, fetch)
            ])
        )
    ) as Record<SettingsTabId, SettingsTabFormData>;

    return {
        general: tabForms.general,
        library: tabForms.library,
        downloaders: tabForms.downloaders,
        content: tabForms.content,
        scraping: tabForms.scraping,
        advanced: tabForms.advanced
    };
};

const createSettingsAction =
    (tabId: SettingsTabId): Actions[string] =>
    async ({ request, fetch, locals }) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const handleForm = createFormHandler<any, true>({
            ...defaults,
            schema: await getSchemaForTab(tabId, locals.backendUrl, locals.apiKey, fetch),
            sendData: true
        });

        const [form] = await handleForm(request.signal, await request.formData());
        if (!form.isValid) {
            return fail(400, { [tabId]: form });
        }

        const res = await providers.riven.POST("/api/v1/settings/set/all", {
            body: form.data,
            baseUrl: locals.backendUrl,
            headers: {
                "x-api-key": locals.apiKey
            },
            fetch: fetch
        });

        if (res.error) {
            return fail(500, { [tabId]: form });
        }

        return { [tabId]: form };
    };

export const actions = {
    general: createSettingsAction("general"),
    library: createSettingsAction("library"),
    downloaders: createSettingsAction("downloaders"),
    content: createSettingsAction("content"),
    scraping: createSettingsAction("scraping"),
    advanced: createSettingsAction("advanced")
} satisfies Actions;

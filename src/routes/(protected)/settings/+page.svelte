<script lang="ts">
    import type { ActionData, PageData } from "./$types";
    import { BasicForm } from "@sjsf/form";
    import { createMeta, setupSvelteKitForm } from "@sjsf/sveltekit/client";
    import * as defaults from "$lib/components/settings/form-defaults";
    import { setShadcnContext } from "$lib/components/shadcn-context";
    import { toast } from "svelte-sonner";
    import { icons } from "@sjsf/lucide-icons";
    import PageShell from "$lib/components/page-shell.svelte";
    import * as Tabs from "$lib/components/ui/tabs";
    import { settingsTabs } from "$lib/components/settings/settings-tabs";
    setShadcnContext();

    let { data }: { data: PageData } = $props();

    const meta = createMeta<ActionData, PageData>();

    const formOptions = {
        ...defaults,
        icons,
        reset: false,
        delayedMs: 500,
        timeoutMs: 30000,
        onSuccess: (result: { type: string }) => {
            if (result.type === "success") {
                toast.success("Settings saved");
            } else {
                toast.error("Failed to save settings");
            }
        },
        onFailure: () => {
            toast.error("Something went wrong while saving settings");
        }
    };

    const forms = {
        general: setupSvelteKitForm(meta.general, {
            ...formOptions,
            get schema() {
                return data.general.schema;
            }
        }).form,
        library: setupSvelteKitForm(meta.library, {
            ...formOptions,
            get schema() {
                return data.library.schema;
            }
        }).form,
        downloaders: setupSvelteKitForm(meta.downloaders, {
            ...formOptions,
            get schema() {
                return data.downloaders.schema;
            }
        }).form,
        content: setupSvelteKitForm(meta.content, {
            ...formOptions,
            get schema() {
                return data.content.schema;
            }
        }).form,
        scraping: setupSvelteKitForm(meta.scraping, {
            ...formOptions,
            get schema() {
                return data.scraping.schema;
            }
        }).form,
        advanced: setupSvelteKitForm(meta.advanced, {
            ...formOptions,
            get schema() {
                return data.advanced.schema;
            }
        }).form
    };

    let activeTab = $state("general");
</script>

<svelte:head>
    <title>Settings - Riven</title>
</svelte:head>

<PageShell class="h-full">
    <div class="flex flex-col gap-5">
        <h1 class="text-2xl font-semibold tracking-normal">Settings</h1>

        <Tabs.Root bind:value={activeTab} class="gap-6">
            <div class="overflow-x-auto pb-1">
                <Tabs.List
                    class="border-border bg-card/60 h-auto min-w-max justify-start rounded-xl border p-1">
                    {#each settingsTabs as tab}
                        <Tabs.Trigger value={tab.id} class="min-w-fit px-3">
                            {tab.label}
                        </Tabs.Trigger>
                    {/each}
                </Tabs.List>
            </div>

            {#each settingsTabs as tab}
                <Tabs.Content value={tab.id}>
                    <BasicForm form={forms[tab.id]} method="POST" action={`?/${tab.id}`} />
                </Tabs.Content>
            {/each}
        </Tabs.Root>
    </div>
</PageShell>

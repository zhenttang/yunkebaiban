// @ts-nocheck
/* eslint-disable */
import { createElement, useMemo, type ComponentType, type JSX } from "react";
import { useTranslation, Trans, type TransProps } from "react-i18next";
type TypedTransProps<Value, Components, Context extends string | undefined = undefined> = Omit<TransProps<string, never, never, Context>, "values" | "ns" | "i18nKey"> & ({} extends Value ? {} : {
    values: Value;
}) & {
    components: Components;
};
function createProxy(initValue: (key: string) => any) {
    function define(key: string) {
        const value = initValue(key);
        Object.defineProperty(container, key, { value, configurable: true });
        return value;
    }
    const container = {
        __proto__: new Proxy({ __proto__: null }, {
            get(_, key) {
                if (typeof key === "symbol")
                    return undefined;
                return define(key);
            },
        }),
    };
    return new Proxy(container, {
        getPrototypeOf: () => null,
        setPrototypeOf: (_, v) => v === null,
        getOwnPropertyDescriptor: (_, key) => {
            if (typeof key === "symbol")
                return undefined;
            if (!(key in container))
                define(key);
            return Object.getOwnPropertyDescriptor(container, key);
        },
    });
}
export function useYUNKEI18N(): {
    /**
      * `Back to my Content`
      */
    ["404.back"](): string;
    /**
      * `Sorry, you do not have access or this content does not exist...`
      */
    ["404.hint"](): string;
    /**
      * `Sign in to another account`
      */
    ["404.signOut"](): string;
    /**
      * `YUNKE Cloud`
      */
    ["YUNKE Cloud"](): string;
    /**
      * `All docs`
      */
    ["All pages"](): string;
    /**
      * `App version`
      */
    ["App Version"](): string;
    /**
      * `Available offline`
      */
    ["Available Offline"](): string;
    /**
      * `Bold`
      */
    Bold(): string;
    /**
      * `Cancel`
      */
    Cancel(): string;
    /**
      * `Click to replace photo`
      */
    ["Click to replace photo"](): string;
    /**
      * `Collections`
      */
    Collections(): string;
    /**
      * `Complete`
      */
    Complete(): string;
    /**
      * `Confirm`
      */
    Confirm(): string;
    /**
      * `Continue`
      */
    Continue(): string;
    /**
      * `Convert to `
      */
    ["Convert to "](): string;
    /**
      * `Copied link to clipboard`
      */
    ["Copied link to clipboard"](): string;
    /**
      * `Copy`
      */
    Copy(): string;
    /**
      * `Create`
      */
    Create(): string;
    /**
      * `Created`
      */
    Created(): string;
    /**
      * `Customise`
      */
    Customize(): string;
    /**
      * `Colors`
      */
    Colors(): string;
    /**
      * `Database file already loaded`
      */
    DB_FILE_ALREADY_LOADED(): string;
    /**
      * `Invalid database file`
      */
    DB_FILE_INVALID(): string;
    /**
      * `Database file migration failed`
      */
    DB_FILE_MIGRATION_FAILED(): string;
    /**
      * `Database file path invalid`
      */
    DB_FILE_PATH_INVALID(): string;
    /**
      * `Date`
      */
    Date(): string;
    /**
      * `Delete`
      */
    Delete(): string;
    /**
      * `Deleted`
      */
    Deleted(): string;
    /**
      * `Disable`
      */
    Disable(): string;
    /**
      * `Disable public sharing`
      */
    ["Disable Public Sharing"](): string;
    /**
      * `Disable snapshot`
      */
    ["Disable Snapshot"](): string;
    /**
      * `Divider`
      */
    Divider(): string;
    /**
      * `Edgeless`
      */
    Edgeless(): string;
    /**
      * `Edit`
      */
    Edit(): string;
    /**
      * `Editor version`
      */
    ["Editor Version"](): string;
    /**
      * `Enable`
      */
    Enable(): string;
    /**
      * `Enable YUNKE Cloud`
      */
    ["Enable YUNKE Cloud"](): string;
    /**
      * `If enabled, the data in this workspace will be backed up and synchronised via YUNKE Cloud.`
      */
    ["Enable YUNKE Cloud Description"](): string;
    /**
      * `The following functions rely on YUNKE Cloud. All data is stored on the current device. You can enable YUNKE Cloud for this workspace to keep data in sync with the cloud.`
      */
    ["Enable cloud hint"](): string;
    /**
      * `Full Backup`
      */
    ["Full Backup"](): string;
    /**
      * `Export a complete workspace backup`
      */
    ["Full Backup Description"](): string;
    /**
      * `Sync all cloud data and export a complete workspace backup`
      */
    ["Full Backup Hint"](): string;
    /**
      * `Quick Export`
      */
    ["Quick Export"](): string;
    /**
      * `Skip cloud synchronization and quickly export current data(some attachments or docs may be missing)`
      */
    ["Quick Export Description"](): string;
    /**
      * `Export failed`
      */
    ["Export failed"](): string;
    /**
      * `Export success`
      */
    ["Export success"](): string;
    /**
      * `Export to HTML`
      */
    ["Export to HTML"](): string;
    /**
      * `Export to Markdown`
      */
    ["Export to Markdown"](): string;
    /**
      * `Export to PNG`
      */
    ["Export to PNG"](): string;
    /**
      * `File already exists`
      */
    FILE_ALREADY_EXISTS(): string;
    /**
      * `Favourite`
      */
    Favorite(): string;
    /**
      * `Favourited`
      */
    Favorited(): string;
    /**
      * `Favourites`
      */
    Favorites(): string;
    /**
      * `Feedback`
      */
    Feedback(): string;
    /**
      * `Found 0 results`
      */
    ["Find 0 result"](): string;
    /**
      * `Go back`
      */
    ["Go Back"](): string;
    /**
      * `Go forward`
      */
    ["Go Forward"](): string;
    /**
      * `Got it`
      */
    ["Got it"](): string;
    /**
      * `Heading {{number}}`
      */
    Heading(options: {
        readonly number: string;
    }): string;
    /**
      * `Image`
      */
    Image(): string;
    /**
      * `Import`
      */
    Import(): string;
    /**
      * `Info`
      */
    Info(): string;
    /**
      * `Invitation sent`
      */
    ["Invitation sent"](): string;
    /**
      * `Invited members have been notified with email to join this Workspace.`
      */
    ["Invitation sent hint"](): string;
    /**
      * `Invite`
      */
    Invite(): string;
    /**
      * `Invite members`
      */
    ["Invite Members"](): string;
    /**
      * `Invited members will collaborate with you in current workspace`
      */
    ["Invite Members Message"](): string;
    /**
      * `Insufficient team seat`
      */
    ["insufficient-team-seat"](): string;
    /**
      * `Joined workspace`
      */
    ["Joined Workspace"](): string;
    /**
      * `Leave`
      */
    Leave(): string;
    /**
      * `Hyperlink (with selected text)`
      */
    Link(): string;
    /**
      * `Loading...`
      */
    Loading(): string;
    /**
      * `Local`
      */
    Local(): string;
    /**
      * `Member`
      */
    Member(): string;
    /**
      * `Members`
      */
    Members(): string;
    /**
      * `Manage members here, invite new member by email.`
      */
    ["Members hint"](): string;
    /**
      * `New doc`
      */
    ["New Page"](): string;
    /**
      * `Owner`
      */
    Owner(): string;
    /**
      * `Page`
      */
    Page(): string;
    /**
      * `Pen`
      */
    Pen(): string;
    /**
      * `Pending`
      */
    Pending(): string;
    /**
      * `Collaborator`
      */
    Collaborator(): string;
    /**
      * `Under Review`
      */
    ["Under-Review"](): string;
    /**
      * `Need More Seats`
      */
    ["Need-More-Seats"](): string;
    /**
      * `Allocating Seat`
      */
    ["Allocating Seat"](): string;
    /**
      * `Admin`
      */
    Admin(): string;
    /**
      * `Publish`
      */
    Publish(): string;
    /**
      * `Published to web`
      */
    ["Published to Web"](): string;
    /**
      * `Quick search`
      */
    ["Quick Search"](): string;
    /**
      * `Search`
      */
    ["Quick search"](): string;
    /**
      * `Recent`
      */
    Recent(): string;
    /**
      * `Remove from workspace`
      */
    ["Remove from workspace"](): string;
    /**
      * `Remove photo`
      */
    ["Remove photo"](): string;
    /**
      * `Remove special filter`
      */
    ["Remove special filter"](): string;
    /**
      * `Removed successfully`
      */
    ["Removed successfully"](): string;
    /**
      * `Rename`
      */
    Rename(): string;
    /**
      * `Retry`
      */
    Retry(): string;
    /**
      * `Save`
      */
    Save(): string;
    /**
      * `Select`
      */
    Select(): string;
    /**
      * `Sign in`
      */
    ["Sign in"](): string;
    /**
      * `Sign in and enable`
      */
    ["Sign in and Enable"](): string;
    /**
      * `Sign out`
      */
    ["Sign out"](): string;
    /**
      * `Snapshot`
      */
    Snapshot(): string;
    /**
      * `Storage`
      */
    Storage(): string;
    /**
      * `Storage and export`
      */
    ["Storage and Export"](): string;
    /**
      * `Successfully deleted`
      */
    ["Successfully deleted"](): string;
    /**
      * `Successfully joined!`
      */
    ["Successfully joined!"](): string;
    /**
      * `Switch`
      */
    Switch(): string;
    /**
      * `Switch view`
      */
    switchView(): string;
    /**
      * `Sync`
      */
    Sync(): string;
    /**
      * `Synced with YUNKE Cloud`
      */
    ["Synced with YUNKE Cloud"](): string;
    /**
      * `Tags`
      */
    Tags(): string;
    /**
      * `Text`
      */
    Text(): string;
    /**
      * `Theme`
      */
    Theme(): string;
    /**
      * `Title`
      */
    Title(): string;
    /**
      * `Trash`
      */
    Trash(): string;
    /**
      * `Unknown error`
      */
    UNKNOWN_ERROR(): string;
    /**
      * `Undo`
      */
    Undo(): string;
    /**
      * `Unpin`
      */
    Unpin(): string;
    /**
      * `Untitled`
      */
    Untitled(): string;
    /**
      * `Update workspace name success`
      */
    ["Update workspace name success"](): string;
    /**
      * `Updated`
      */
    Updated(): string;
    /**
      * `Upload`
      */
    Upload(): string;
    /**
      * `Users`
      */
    Users(): string;
    /**
      * `Version`
      */
    Version(): string;
    /**
      * `Visit workspace`
      */
    ["Visit Workspace"](): string;
    /**
      * `Workspace name`
      */
    ["Workspace Name"](): string;
    /**
      * `Workspace Owner`
      */
    ["Workspace Owner"](): string;
    /**
      * `Workspace profile`
      */
    ["Workspace Profile"](): string;
    /**
      * `Workspace settings`
      */
    ["Workspace Settings"](): string;
    /**
      * `{{name}}'s settings`
      */
    ["Workspace Settings with name"](options: {
        readonly name: string;
    }): string;
    /**
      * `{{name}} is saved locally`
      */
    ["Workspace saved locally"](options: {
        readonly name: string;
    }): string;
    /**
      * `Zoom in`
      */
    ["Zoom in"](): string;
    /**
      * `Zoom out`
      */
    ["Zoom out"](): string;
    /**
      * `Unknown User`
      */
    ["Unknown User"](): string;
    /**
      * `Deleted User`
      */
    ["Deleted User"](): string;
    /**
      * `all`
      */
    all(): string;
    /**
      * `current`
      */
    current(): string;
    /**
      * `created at {{time}}`
      */
    ["created at"](options: {
        readonly time: string;
    }): string;
    /**
      * `last updated at {{time}}`
      */
    ["updated at"](options: {
        readonly time: string;
    }): string;
    /**
      * `Automatically check for new updates periodically.`
      */
    ["com.yunke.aboutYUNKE.autoCheckUpdate.description"](): string;
    /**
      * `Check for updates automatically`
      */
    ["com.yunke.aboutYUNKE.autoCheckUpdate.title"](): string;
    /**
      * `Automatically download updates (to this device).`
      */
    ["com.yunke.aboutYUNKE.autoDownloadUpdate.description"](): string;
    /**
      * `Download updates automatically`
      */
    ["com.yunke.aboutYUNKE.autoDownloadUpdate.title"](): string;
    /**
      * `View the YUNKE Changelog.`
      */
    ["com.yunke.aboutYUNKE.changelog.description"](): string;
    /**
      * `Discover what's new`
      */
    ["com.yunke.aboutYUNKE.changelog.title"](): string;
    /**
      * `Check for update`
      */
    ["com.yunke.aboutYUNKE.checkUpdate.button.check"](): string;
    /**
      * `Download update`
      */
    ["com.yunke.aboutYUNKE.checkUpdate.button.download"](): string;
    /**
      * `Restart to update`
      */
    ["com.yunke.aboutYUNKE.checkUpdate.button.restart"](): string;
    /**
      * `Retry`
      */
    ["com.yunke.aboutYUNKE.checkUpdate.button.retry"](): string;
    /**
      * `New version is ready`
      */
    ["com.yunke.aboutYUNKE.checkUpdate.description"](): string;
    /**
      * `Manually check for updates.`
      */
    ["com.yunke.aboutYUNKE.checkUpdate.subtitle.check"](): string;
    /**
      * `Checking for updates...`
      */
    ["com.yunke.aboutYUNKE.checkUpdate.subtitle.checking"](): string;
    /**
      * `Downloading the latest version...`
      */
    ["com.yunke.aboutYUNKE.checkUpdate.subtitle.downloading"](): string;
    /**
      * `Unable to connect to the update server.`
      */
    ["com.yunke.aboutYUNKE.checkUpdate.subtitle.error"](): string;
    /**
      * `You've got the latest version of YUNKE.`
      */
    ["com.yunke.aboutYUNKE.checkUpdate.subtitle.latest"](): string;
    /**
      * `Restart to apply update.`
      */
    ["com.yunke.aboutYUNKE.checkUpdate.subtitle.restart"](): string;
    /**
      * `New update available ({{version}})`
      */
    ["com.yunke.aboutYUNKE.checkUpdate.subtitle.update-available"](options: {
        readonly version: string;
    }): string;
    /**
      * `Check for updates`
      */
    ["com.yunke.aboutYUNKE.checkUpdate.title"](): string;
    /**
      * `Communities`
      */
    ["com.yunke.aboutYUNKE.community.title"](): string;
    /**
      * `YUNKE community`
      */
    ["com.yunke.aboutYUNKE.contact.community"](): string;
    /**
      * `Contact us`
      */
    ["com.yunke.aboutYUNKE.contact.title"](): string;
    /**
      * `Official website`
      */
    ["com.yunke.aboutYUNKE.contact.website"](): string;
    /**
      * `Privacy`
      */
    ["com.yunke.aboutYUNKE.legal.privacy"](): string;
    /**
      * `Legal Info`
      */
    ["com.yunke.aboutYUNKE.legal.title"](): string;
    /**
      * `Terms of use`
      */
    ["com.yunke.aboutYUNKE.legal.tos"](): string;
    /**
      * `Information about YUNKE`
      */
    ["com.yunke.aboutYUNKE.subtitle"](): string;
    /**
      * `About YUNKE`
      */
    ["com.yunke.aboutYUNKE.title"](): string;
    /**
      * `App version`
      */
    ["com.yunke.aboutYUNKE.version.app"](): string;
    /**
      * `Editor version`
      */
    ["com.yunke.aboutYUNKE.version.editor.title"](): string;
    /**
      * `Version`
      */
    ["com.yunke.aboutYUNKE.version.title"](): string;
    /**
      * `Get started`
      */
    ["com.yunke.ai-onboarding.edgeless.get-started"](): string;
    /**
      * `Lets you think bigger, create faster, work smarter and save time for every project.`
      */
    ["com.yunke.ai-onboarding.edgeless.message"](): string;
    /**
      * `Upgrade to unlimited usage`
      */
    ["com.yunke.ai-onboarding.edgeless.purchase"](): string;
    /**
      * `Right-clicking to select content AI`
      */
    ["com.yunke.ai-onboarding.edgeless.title"](): string;
    /**
      * `Lets you think bigger, create faster, work smarter and save time for every project.`
      */
    ["com.yunke.ai-onboarding.general.1.description"](): string;
    /**
      * `Meet YUNKE AI`
      */
    ["com.yunke.ai-onboarding.general.1.title"](): string;
    /**
      * `Answer questions, draft docs, visualize ideas - YUNKE AI can save you time at every possible step. Powered by GPT's most powerful model.`
      */
    ["com.yunke.ai-onboarding.general.2.description"](): string;
    /**
      * `Chat with YUNKE AI`
      */
    ["com.yunke.ai-onboarding.general.2.title"](): string;
    /**
      * `Get insightful answer to any question, instantly.`
      */
    ["com.yunke.ai-onboarding.general.3.description"](): string;
    /**
      * `Edit inline with YUNKE AI`
      */
    ["com.yunke.ai-onboarding.general.3.title"](): string;
    /**
      * `Expand thinking. Untangle complexity. Breakdown and visualise your content with crafted mindmap and presentable slides with one click.`
      */
    ["com.yunke.ai-onboarding.general.4.description"](): string;
    /**
      * `Make mind-map and presents with AI`
      */
    ["com.yunke.ai-onboarding.general.4.title"](): string;
    /**
      * `YUNKE AI is ready`
      */
    ["com.yunke.ai-onboarding.general.5.title"](): string;
    /**
      * `Get started`
      */
    ["com.yunke.ai-onboarding.general.get-started"](): string;
    /**
      * `Next`
      */
    ["com.yunke.ai-onboarding.general.next"](): string;
    /**
      * `Back`
      */
    ["com.yunke.ai-onboarding.general.prev"](): string;
    /**
      * `Get unlimited usage`
      */
    ["com.yunke.ai-onboarding.general.purchase"](): string;
    /**
      * `Remind me later`
      */
    ["com.yunke.ai-onboarding.general.skip"](): string;
    /**
      * `Try for free`
      */
    ["com.yunke.ai-onboarding.general.try-for-free"](): string;
    /**
      * `Dismiss`
      */
    ["com.yunke.ai-onboarding.local.action-dismiss"](): string;
    /**
      * `Get started`
      */
    ["com.yunke.ai-onboarding.local.action-get-started"](): string;
    /**
      * `Learn more`
      */
    ["com.yunke.ai-onboarding.local.action-learn-more"](): string;
    /**
      * `Lets you think bigger, create faster, work smarter and save time for every project.`
      */
    ["com.yunke.ai-onboarding.local.message"](): string;
    /**
      * `Meet YUNKE AI`
      */
    ["com.yunke.ai-onboarding.local.title"](): string;
    /**
      * `New`
      */
    ["com.yunke.ai-scroll-tip.tag"](): string;
    /**
      * `Meet YUNKE AI`
      */
    ["com.yunke.ai-scroll-tip.title"](): string;
    /**
      * `View`
      */
    ["com.yunke.ai-scroll-tip.view"](): string;
    /**
      * `Please switch to edgeless mode`
      */
    ["com.yunke.ai.action.edgeless-only.dialog-title"](): string;
    /**
      * `Cancel`
      */
    ["com.yunke.ai.login-required.dialog-cancel"](): string;
    /**
      * `Sign in`
      */
    ["com.yunke.ai.login-required.dialog-confirm"](): string;
    /**
      * `To use YUNKE AI, please sign in to your YUNKE Cloud account.`
      */
    ["com.yunke.ai.login-required.dialog-content"](): string;
    /**
      * `Sign in to continue`
      */
    ["com.yunke.ai.login-required.dialog-title"](): string;
    /**
      * `Failed to insert template, please try again.`
      */
    ["com.yunke.ai.template-insert.failed"](): string;
    /**
      * `All docs`
      */
    ["com.yunke.all-pages.header"](): string;
    /**
      * `Learn more`
      */
    ["com.yunke.app-sidebar.learn-more"](): string;
    /**
      * `Star us`
      */
    ["com.yunke.app-sidebar.star-us"](): string;
    /**
      * `Download update`
      */
    ["com.yunke.appUpdater.downloadUpdate"](): string;
    /**
      * `Downloading`
      */
    ["com.yunke.appUpdater.downloading"](): string;
    /**
      * `Restart to install update`
      */
    ["com.yunke.appUpdater.installUpdate"](): string;
    /**
      * `Open download page`
      */
    ["com.yunke.appUpdater.openDownloadPage"](): string;
    /**
      * `Update available`
      */
    ["com.yunke.appUpdater.updateAvailable"](): string;
    /**
      * `Discover what's new!`
      */
    ["com.yunke.appUpdater.whatsNew"](): string;
    /**
      * `Customise the appearance of the client.`
      */
    ["com.yunke.appearanceSettings.clientBorder.description"](): string;
    /**
      * `Client border style`
      */
    ["com.yunke.appearanceSettings.clientBorder.title"](): string;
    /**
      * `Choose your colour mode`
      */
    ["com.yunke.appearanceSettings.color.description"](): string;
    /**
      * `Colour mode`
      */
    ["com.yunke.appearanceSettings.color.title"](): string;
    /**
      * `Edit all YUNKE theme variables here`
      */
    ["com.yunke.appearanceSettings.customize-theme.description"](): string;
    /**
      * `Customize Theme`
      */
    ["com.yunke.appearanceSettings.customize-theme.title"](): string;
    /**
      * `Reset all`
      */
    ["com.yunke.appearanceSettings.customize-theme.reset"](): string;
    /**
      * `Open Theme Editor`
      */
    ["com.yunke.appearanceSettings.customize-theme.open"](): string;
    /**
      * `Choose your font style`
      */
    ["com.yunke.appearanceSettings.font.description"](): string;
    /**
      * `Font style`
      */
    ["com.yunke.appearanceSettings.font.title"](): string;
    /**
      * `Mono`
      */
    ["com.yunke.appearanceSettings.fontStyle.mono"](): string;
    /**
      * `Sans`
      */
    ["com.yunke.appearanceSettings.fontStyle.sans"](): string;
    /**
      * `Serif`
      */
    ["com.yunke.appearanceSettings.fontStyle.serif"](): string;
    /**
      * `Select the language for the interface.`
      */
    ["com.yunke.appearanceSettings.language.description"](): string;
    /**
      * `Display language`
      */
    ["com.yunke.appearanceSettings.language.title"](): string;
    /**
      * `Use background noise effect on the sidebar.`
      */
    ["com.yunke.appearanceSettings.noisyBackground.description"](): string;
    /**
      * `Noise background on the sidebar`
      */
    ["com.yunke.appearanceSettings.noisyBackground.title"](): string;
    /**
      * `Sidebar`
      */
    ["com.yunke.appearanceSettings.sidebar.title"](): string;
    /**
      * `Customize your YUNKE appearance`
      */
    ["com.yunke.appearanceSettings.subtitle"](): string;
    /**
      * `Menubar`
      */
    ["com.yunke.appearanceSettings.menubar.title"](): string;
    /**
      * `Enable menubar app`
      */
    ["com.yunke.appearanceSettings.menubar.toggle"](): string;
    /**
      * `Display the menubar app in the tray for quick access to YUNKE or meeting recordings.`
      */
    ["com.yunke.appearanceSettings.menubar.description"](): string;
    /**
      * `Theme`
      */
    ["com.yunke.appearanceSettings.theme.title"](): string;
    /**
      * `Appearance settings`
      */
    ["com.yunke.appearanceSettings.title"](): string;
    /**
      * `Use transparency effect on the sidebar.`
      */
    ["com.yunke.appearanceSettings.translucentUI.description"](): string;
    /**
      * `Translucent UI on the sidebar`
      */
    ["com.yunke.appearanceSettings.translucentUI.title"](): string;
    /**
      * `Your current email is {{email}}. We'll send a temporary verification link to this email.`
      */
    ["com.yunke.auth.change.email.message"](options: {
        readonly email: string;
    }): string;
    /**
      * `Please enter your new email address below. We will send a verification link to this email address to complete the process.`
      */
    ["com.yunke.auth.change.email.page.subtitle"](): string;
    /**
      * `Congratulations! You have successfully updated the email address associated with your YUNKE Cloud account.`
      */
    ["com.yunke.auth.change.email.page.success.subtitle"](): string;
    /**
      * `Email address updated!`
      */
    ["com.yunke.auth.change.email.page.success.title"](): string;
    /**
      * `Change email address`
      */
    ["com.yunke.auth.change.email.page.title"](): string;
    /**
      * `Forgot password`
      */
    ["com.yunke.auth.forget"](): string;
    /**
      * `Later`
      */
    ["com.yunke.auth.later"](): string;
    /**
      * `Open YUNKE`
      */
    ["com.yunke.auth.open.yunke"](): string;
    /**
      * `Download app`
      */
    ["com.yunke.auth.open.yunke.download-app"](): string;
    /**
      * `Try again`
      */
    ["com.yunke.auth.open.yunke.try-again"](): string;
    /**
      * `Still have problems?`
      */
    ["com.yunke.auth.open.yunke.still-have-problems"](): string;
    /**
      * `Continue with Browser`
      */
    ["com.yunke.auth.open.yunke.continue-with-browser"](): string;
    /**
      * `Download Latest Client`
      */
    ["com.yunke.auth.open.yunke.download-latest-client"](): string;
    /**
      * `Open here instead`
      */
    ["com.yunke.auth.open.yunke.doc.open-here"](): string;
    /**
      * `Edit settings`
      */
    ["com.yunke.auth.open.yunke.doc.edit-settings"](): string;
    /**
      * `Requires YUNKE desktop app version 0.18 or later.`
      */
    ["com.yunke.auth.open.yunke.doc.footer-text"](): string;
    /**
      * `Please set a password of {{min}}-{{max}} characters with both letters and numbers to continue signing up with `
      */
    ["com.yunke.auth.page.sent.email.subtitle"](options: Readonly<{
        min: string;
        max: string;
    }>): string;
    /**
      * `Welcome to YUNKE Cloud, you are almost there!`
      */
    ["com.yunke.auth.page.sent.email.title"](): string;
    /**
      * `Password`
      */
    ["com.yunke.auth.password"](): string;
    /**
      * `Invalid password`
      */
    ["com.yunke.auth.password.error"](): string;
    /**
      * `Set password failed`
      */
    ["com.yunke.auth.password.set-failed"](): string;
    /**
      * `Reset password`
      */
    ["com.yunke.auth.reset.password"](): string;
    /**
      * `You will receive an email with a link to reset your password. Please check your inbox.`
      */
    ["com.yunke.auth.reset.password.message"](): string;
    /**
      * `Password reset successful`
      */
    ["com.yunke.auth.reset.password.page.success"](): string;
    /**
      * `Reset your YUNKE Cloud password`
      */
    ["com.yunke.auth.reset.password.page.title"](): string;
    /**
      * `Send reset link`
      */
    ["com.yunke.auth.send.reset.password.link"](): string;
    /**
      * `Send set link`
      */
    ["com.yunke.auth.send.set.password.link"](): string;
    /**
      * `Send verification link`
      */
    ["com.yunke.auth.send.verify.email.hint"](): string;
    /**
      * `Verification code`
      */
    ["com.yunke.auth.sign.auth.code"](): string;
    /**
      * `Invalid verification code`
      */
    ["com.yunke.auth.sign.auth.code.invalid"](): string;
    /**
      * `Continue with code`
      */
    ["com.yunke.auth.sign.auth.code.continue"](): string;
    /**
      * `Resend code`
      */
    ["com.yunke.auth.sign.auth.code.resend"](): string;
    /**
      * `Resend in {{second}}s`
      */
    ["com.yunke.auth.sign.auth.code.resend.hint"](options: {
        readonly second: string;
    }): string;
    /**
      * `Sent`
      */
    ["com.yunke.auth.sent"](): string;
    /**
      * `The verification link failed to be sent, please try again later.`
      */
    ["com.yunke.auth.sent.change.email.fail"](): string;
    /**
      * `Verification link has been sent.`
      */
    ["com.yunke.auth.sent.change.email.hint"](): string;
    /**
      * `Reset password link has been sent.`
      */
    ["com.yunke.auth.sent.change.password.hint"](): string;
    /**
      * `Your password has been updated! You can sign in YUNKE Cloud with new password!`
      */
    ["com.yunke.auth.sent.reset.password.success.message"](): string;
    /**
      * `Set password link has been sent.`
      */
    ["com.yunke.auth.sent.set.password.hint"](): string;
    /**
      * `Your password has saved! You can sign in YUNKE Cloud with email and password!`
      */
    ["com.yunke.auth.sent.set.password.success.message"](): string;
    /**
      * `Verification link has been sent.`
      */
    ["com.yunke.auth.sent.verify.email.hint"](): string;
    /**
      * `Save Email`
      */
    ["com.yunke.auth.set.email.save"](): string;
    /**
      * `Set password`
      */
    ["com.yunke.auth.set.password"](): string;
    /**
      * `Please set a password of {{min}}-{{max}} characters with both letters and numbers to continue signing up with `
      */
    ["com.yunke.auth.set.password.message"](options: Readonly<{
        min: string;
        max: string;
    }>): string;
    /**
      * `Maximum {{max}} characters`
      */
    ["com.yunke.auth.set.password.message.maxlength"](options: {
        readonly max: string;
    }): string;
    /**
      * `Minimum {{min}} characters`
      */
    ["com.yunke.auth.set.password.message.minlength"](options: {
        readonly min: string;
    }): string;
    /**
      * `Password set successful`
      */
    ["com.yunke.auth.set.password.page.success"](): string;
    /**
      * `Set your YUNKE Cloud password`
      */
    ["com.yunke.auth.set.password.page.title"](): string;
    /**
      * `Set a password at least {{min}} letters long`
      */
    ["com.yunke.auth.set.password.placeholder"](options: {
        readonly min: string;
    }): string;
    /**
      * `Confirm password`
      */
    ["com.yunke.auth.set.password.placeholder.confirm"](): string;
    /**
      * `Save password`
      */
    ["com.yunke.auth.set.password.save"](): string;
    /**
      * `Cancel`
      */
    ["com.yunke.auth.sign-out.confirm-modal.cancel"](): string;
    /**
      * `Sign Out`
      */
    ["com.yunke.auth.sign-out.confirm-modal.confirm"](): string;
    /**
      * `After signing out, the Cloud Workspaces associated with this account will be removed from the current device, and signing in again will add them back.`
      */
    ["com.yunke.auth.sign-out.confirm-modal.description"](): string;
    /**
      * `Sign out?`
      */
    ["com.yunke.auth.sign-out.confirm-modal.title"](): string;
    /**
      * `If you haven't received the email, please check your spam folder.`
      */
    ["com.yunke.auth.sign.auth.code.message"](): string;
    /**
      * `Sign in with magic link`
      */
    ["com.yunke.auth.sign.auth.code.send-email.sign-in"](): string;
    /**
      * `Terms of conditions`
      */
    ["com.yunke.auth.sign.condition"](): string;
    /**
      * `Continue with email`
      */
    ["com.yunke.auth.sign.email.continue"](): string;
    /**
      * `Invalid email`
      */
    ["com.yunke.auth.sign.email.error"](): string;
    /**
      * `Enter your email address`
      */
    ["com.yunke.auth.sign.email.placeholder"](): string;
    /**
      * `Sign in`
      */
    ["com.yunke.auth.sign.in"](): string;
    /**
      * `Confirm your email`
      */
    ["com.yunke.auth.sign.in.sent.email.subtitle"](): string;
    /**
      * `Self-Hosted`
      */
    ["com.yunke.auth.sign.add-selfhosted.title"](): string;
    /**
      * `Connect to a Self-Hosted Instance`
      */
    ["com.yunke.auth.sign.add-selfhosted"](): string;
    /**
      * `Server URL`
      */
    ["com.yunke.auth.sign.add-selfhosted.baseurl"](): string;
    /**
      * `Connect`
      */
    ["com.yunke.auth.sign.add-selfhosted.connect-button"](): string;
    /**
      * `Unable to connect to the server.`
      */
    ["com.yunke.auth.sign.add-selfhosted.error"](): string;
    /**
      * `Privacy policy`
      */
    ["com.yunke.auth.sign.policy"](): string;
    /**
      * `Sign up`
      */
    ["com.yunke.auth.sign.up"](): string;
    /**
      * `Create your account`
      */
    ["com.yunke.auth.sign.up.sent.email.subtitle"](): string;
    /**
      * `The app will automatically open or redirect to the web version. If you encounter any issues, you can also click the button below to manually open the YUNKE app.`
      */
    ["com.yunke.auth.sign.up.success.subtitle"](): string;
    /**
      * `Your account has been created and you're now signed in!`
      */
    ["com.yunke.auth.sign.up.success.title"](): string;
    /**
      * `You have successfully signed in. The app will automatically open or redirect to the web version. if you encounter any issues, you can also click the button below to  manually open the YUNKE app.`
      */
    ["com.yunke.auth.signed.success.subtitle"](): string;
    /**
      * `You're almost there!`
      */
    ["com.yunke.auth.signed.success.title"](): string;
    /**
      * `Server error, please try again later.`
      */
    ["com.yunke.auth.toast.message.failed"](): string;
    /**
      * `You have been signed in, start to sync your data with YUNKE Cloud!`
      */
    ["com.yunke.auth.toast.message.signed-in"](): string;
    /**
      * `Unable to sign in`
      */
    ["com.yunke.auth.toast.title.failed"](): string;
    /**
      * `Signed in`
      */
    ["com.yunke.auth.toast.title.signed-in"](): string;
    /**
      * `Your current email is {{email}}. We'll send a temporary verification link to this email.`
      */
    ["com.yunke.auth.verify.email.message"](options: {
        readonly email: string;
    }): string;
    /**
      * `Back`
      */
    ["com.yunke.backButton"](): string;
    /**
      * `Your local data is stored in the browser and may be lost. Don't risk it - enable cloud now!`
      */
    ["com.yunke.banner.local-warning"](): string;
    /**
      * `YUNKE Cloud`
      */
    ["com.yunke.brand.yunkeCloud"](): string;
    /**
      * `Jan,Feb,Mar,Apr,May,Jun,Jul,Aug,Sep,Oct,Nov,Dec`
      */
    ["com.yunke.calendar-date-picker.month-names"](): string;
    /**
      * `Today`
      */
    ["com.yunke.calendar-date-picker.today"](): string;
    /**
      * `Su,Mo,Tu,We,Th,Fr,Sa`
      */
    ["com.yunke.calendar-date-picker.week-days"](): string;
    /**
      * `Host by YUNKE.Pro, Save, sync, and backup all your data.`
      */
    ["com.yunke.cloud-scroll-tip.caption"](): string;
    /**
      * `YUNKE Cloud`
      */
    ["com.yunke.cloud-scroll-tip.title"](): string;
    /**
      * `Collections`
      */
    ["com.yunke.cmdk.yunke.category.yunke.collections"](): string;
    /**
      * `Create`
      */
    ["com.yunke.cmdk.yunke.category.yunke.creation"](): string;
    /**
      * `Edgeless`
      */
    ["com.yunke.cmdk.yunke.category.yunke.edgeless"](): string;
    /**
      * `General`
      */
    ["com.yunke.cmdk.yunke.category.yunke.general"](): string;
    /**
      * `Help`
      */
    ["com.yunke.cmdk.yunke.category.yunke.help"](): string;
    /**
      * `Layout controls`
      */
    ["com.yunke.cmdk.yunke.category.yunke.layout"](): string;
    /**
      * `Navigation`
      */
    ["com.yunke.cmdk.yunke.category.yunke.navigation"](): string;
    /**
      * `Docs`
      */
    ["com.yunke.cmdk.yunke.category.yunke.pages"](): string;
    /**
      * `Recent`
      */
    ["com.yunke.cmdk.yunke.category.yunke.recent"](): string;
    /**
      * `Settings`
      */
    ["com.yunke.cmdk.yunke.category.yunke.settings"](): string;
    /**
      * `Tags`
      */
    ["com.yunke.cmdk.yunke.category.yunke.tags"](): string;
    /**
      * `Updates`
      */
    ["com.yunke.cmdk.yunke.category.yunke.updates"](): string;
    /**
      * `Edgeless commands`
      */
    ["com.yunke.cmdk.yunke.category.editor.edgeless"](): string;
    /**
      * `Insert object`
      */
    ["com.yunke.cmdk.yunke.category.editor.insert-object"](): string;
    /**
      * `Doc Commands`
      */
    ["com.yunke.cmdk.yunke.category.editor.page"](): string;
    /**
      * `Results`
      */
    ["com.yunke.cmdk.yunke.category.results"](): string;
    /**
      * `Change client border style to`
      */
    ["com.yunke.cmdk.yunke.client-border-style.to"](): string;
    /**
      * `Change colour mode to`
      */
    ["com.yunke.cmdk.yunke.color-mode.to"](): string;
    /**
      * `Contact us`
      */
    ["com.yunke.cmdk.yunke.contact-us"](): string;
    /**
      * `Create "{{keyWord}}" doc and insert`
      */
    ["com.yunke.cmdk.yunke.create-new-doc-and-insert"](options: {
        readonly keyWord: string;
    }): string;
    /**
      * `New "{{keyWord}}" edgeless`
      */
    ["com.yunke.cmdk.yunke.create-new-edgeless-as"](options: {
        readonly keyWord: string;
    }): string;
    /**
      * `New "{{keyWord}}" page`
      */
    ["com.yunke.cmdk.yunke.create-new-page-as"](options: {
        readonly keyWord: string;
    }): string;
    /**
      * `Change display language to`
      */
    ["com.yunke.cmdk.yunke.display-language.to"](): string;
    /**
      * `Add to favourites`
      */
    ["com.yunke.cmdk.yunke.editor.add-to-favourites"](): string;
    /**
      * `Start presentation`
      */
    ["com.yunke.cmdk.yunke.editor.edgeless.presentation-start"](): string;
    /**
      * `Remove from favourites`
      */
    ["com.yunke.cmdk.yunke.editor.remove-from-favourites"](): string;
    /**
      * `Restore from trash`
      */
    ["com.yunke.cmdk.yunke.editor.restore-from-trash"](): string;
    /**
      * `Reveal doc history modal`
      */
    ["com.yunke.cmdk.yunke.editor.reveal-page-history-modal"](): string;
    /**
      * `This doc has been moved to the trash, you can either restore or permanently delete it.`
      */
    ["com.yunke.cmdk.yunke.editor.trash-footer-hint"](): string;
    /**
      * `Change font style to`
      */
    ["com.yunke.cmdk.yunke.font-style.to"](): string;
    /**
      * `Change full width layout to`
      */
    ["com.yunke.cmdk.yunke.full-width-layout.to"](): string;
    /**
      * `Change default width for new pages in to standard`
      */
    ["com.yunke.cmdk.yunke.default-page-width-layout.standard"](): string;
    /**
      * `Change default width for new pages in to full width`
      */
    ["com.yunke.cmdk.yunke.default-page-width-layout.full-width"](): string;
    /**
      * `Change current page width to standard`
      */
    ["com.yunke.cmdk.yunke.current-page-width-layout.standard"](): string;
    /**
      * `Change current page width to full width`
      */
    ["com.yunke.cmdk.yunke.current-page-width-layout.full-width"](): string;
    /**
      * `Getting started`
      */
    ["com.yunke.cmdk.yunke.getting-started"](): string;
    /**
      * `Import workspace`
      */
    ["com.yunke.cmdk.yunke.import-workspace"](): string;
    /**
      * `Insert this link to the current doc`
      */
    ["com.yunke.cmdk.yunke.insert-link"](): string;
    /**
      * `Collapse left sidebar`
      */
    ["com.yunke.cmdk.yunke.left-sidebar.collapse"](): string;
    /**
      * `Expand left sidebar`
      */
    ["com.yunke.cmdk.yunke.left-sidebar.expand"](): string;
    /**
      * `Go to all docs`
      */
    ["com.yunke.cmdk.yunke.navigation.goto-all-pages"](): string;
    /**
      * `Go to edgeless list`
      */
    ["com.yunke.cmdk.yunke.navigation.goto-edgeless-list"](): string;
    /**
      * `Go to page list`
      */
    ["com.yunke.cmdk.yunke.navigation.goto-page-list"](): string;
    /**
      * `Go to trash`
      */
    ["com.yunke.cmdk.yunke.navigation.goto-trash"](): string;
    /**
      * `Go to workspace`
      */
    ["com.yunke.cmdk.yunke.navigation.goto-workspace"](): string;
    /**
      * `Go to account settings`
      */
    ["com.yunke.cmdk.yunke.navigation.open-account-settings"](): string;
    /**
      * `Go to Settings`
      */
    ["com.yunke.cmdk.yunke.navigation.open-settings"](): string;
    /**
      * `New edgeless`
      */
    ["com.yunke.cmdk.yunke.new-edgeless-page"](): string;
    /**
      * `New page`
      */
    ["com.yunke.cmdk.yunke.new-page"](): string;
    /**
      * `New workspace`
      */
    ["com.yunke.cmdk.yunke.new-workspace"](): string;
    /**
      * `Change noise background on the sidebar to`
      */
    ["com.yunke.cmdk.yunke.noise-background-on-the-sidebar.to"](): string;
    /**
      * `Restart to upgrade`
      */
    ["com.yunke.cmdk.yunke.restart-to-upgrade"](): string;
    /**
      * `OFF`
      */
    ["com.yunke.cmdk.yunke.switch-state.off"](): string;
    /**
      * `ON`
      */
    ["com.yunke.cmdk.yunke.switch-state.on"](): string;
    /**
      * `Change translucent UI on the sidebar to`
      */
    ["com.yunke.cmdk.yunke.translucent-ui-on-the-sidebar.to"](): string;
    /**
      * `What's new`
      */
    ["com.yunke.cmdk.yunke.whats-new"](): string;
    /**
      * `Search docs or paste link...`
      */
    ["com.yunke.cmdk.docs.placeholder"](): string;
    /**
      * `Insert links`
      */
    ["com.yunke.cmdk.insert-links"](): string;
    /**
      * `No results found`
      */
    ["com.yunke.cmdk.no-results"](): string;
    /**
      * `No results found for`
      */
    ["com.yunke.cmdk.no-results-for"](): string;
    /**
      * `Type a command or search anything...`
      */
    ["com.yunke.cmdk.placeholder"](): string;
    /**
      * `Switch to $t(com.yunke.edgelessMode)`
      */
    ["com.yunke.cmdk.switch-to-edgeless"](): string;
    /**
      * `Switch to $t(com.yunke.pageMode)`
      */
    ["com.yunke.cmdk.switch-to-page"](): string;
    /**
      * `Delete`
      */
    ["com.yunke.collection-bar.action.tooltip.delete"](): string;
    /**
      * `Edit`
      */
    ["com.yunke.collection-bar.action.tooltip.edit"](): string;
    /**
      * `Pin to sidebar`
      */
    ["com.yunke.collection-bar.action.tooltip.pin"](): string;
    /**
      * `Unpin`
      */
    ["com.yunke.collection-bar.action.tooltip.unpin"](): string;
    /**
      * `Do you want to add a document to the current collection? If it is filtered based on rules, this will add a set of included rules.`
      */
    ["com.yunke.collection.add-doc.confirm.description"](): string;
    /**
      * `Add new doc to this collection`
      */
    ["com.yunke.collection.add-doc.confirm.title"](): string;
    /**
      * `Doc already exists`
      */
    ["com.yunke.collection.addPage.alreadyExists"](): string;
    /**
      * `Added successfully`
      */
    ["com.yunke.collection.addPage.success"](): string;
    /**
      * `Add docs`
      */
    ["com.yunke.collection.addPages"](): string;
    /**
      * `Add rules`
      */
    ["com.yunke.collection.addRules"](): string;
    /**
      * `All collections`
      */
    ["com.yunke.collection.allCollections"](): string;
    /**
      * `Empty collection`
      */
    ["com.yunke.collection.emptyCollection"](): string;
    /**
      * `Collection is a smart folder where you can manually add docs or automatically add docs through rules.`
      */
    ["com.yunke.collection.emptyCollectionDescription"](): string;
    /**
      * `HELP INFO`
      */
    ["com.yunke.collection.helpInfo"](): string;
    /**
      * `Edit collection`
      */
    ["com.yunke.collection.menu.edit"](): string;
    /**
      * `Rename`
      */
    ["com.yunke.collection.menu.rename"](): string;
    /**
      * `Removed successfully`
      */
    ["com.yunke.collection.removePage.success"](): string;
    /**
      * `No collections`
      */
    ["com.yunke.collections.empty.message"](): string;
    /**
      * `New collection`
      */
    ["com.yunke.collections.empty.new-collection-button"](): string;
    /**
      * `Collections`
      */
    ["com.yunke.collections.header"](): string;
    /**
      * `Couldn't copy image`
      */
    ["com.yunke.copy.asImage.notAvailable.title"](): string;
    /**
      * `The 'Copy as image' feature is only available on our desktop app. Please download and install the client to access this feature.`
      */
    ["com.yunke.copy.asImage.notAvailable.message"](): string;
    /**
      * `Download Client`
      */
    ["com.yunke.copy.asImage.notAvailable.action"](): string;
    /**
      * `Image copied`
      */
    ["com.yunke.copy.asImage.success"](): string;
    /**
      * `Image copy failed`
      */
    ["com.yunke.copy.asImage.failed"](): string;
    /**
      * `Cancel`
      */
    ["com.yunke.confirmModal.button.cancel"](): string;
    /**
      * `Ok`
      */
    ["com.yunke.confirmModal.button.ok"](): string;
    /**
      * `Current year`
      */
    ["com.yunke.currentYear"](): string;
    /**
      * `Deleting {{count}} tags cannot be undone, please proceed with caution.`
      */
    ["com.yunke.delete-tags.confirm.multi-tag-description"](options: {
        readonly count: string;
    }): string;
    /**
      * `Delete tag?`
      */
    ["com.yunke.delete-tags.confirm.title"](): string;
    /**
      * `{{count}} tag deleted`
    
      * - com.yunke.delete-tags.count_one: `{{count}} tag deleted`
    
      * - com.yunke.delete-tags.count_other: `{{count}} tags deleted`
      */
    ["com.yunke.delete-tags.count"](options: {
        readonly count: string | number | bigint;
    }): string;
    /**
      * `{{count}} tag deleted`
      */
    ["com.yunke.delete-tags.count_one"](options: {
        readonly count: string | number | bigint;
    }): string;
    /**
      * `{{count}} tags deleted`
      */
    ["com.yunke.delete-tags.count_other"](options: {
        readonly count: string | number | bigint;
    }): string;
    /**
      * `Delete workspace from this device and optionally delete all data.`
      */
    ["com.yunke.deleteLeaveWorkspace.description"](): string;
    /**
      * `Leave workspace`
      */
    ["com.yunke.deleteLeaveWorkspace.leave"](): string;
    /**
      * `After you leave, you will not be able to access content within this workspace.`
      */
    ["com.yunke.deleteLeaveWorkspace.leaveDescription"](): string;
    /**
      * `Docs`
      */
    ["com.yunke.docs.header"](): string;
    /**
      * `Draw with a blank whiteboard`
      */
    ["com.yunke.draw_with_a_blank_whiteboard"](): string;
    /**
      * `Earlier`
      */
    ["com.yunke.earlier"](): string;
    /**
      * `Edgeless mode`
      */
    ["com.yunke.edgelessMode"](): string;
    /**
      * `Cancel`
      */
    ["com.yunke.editCollection.button.cancel"](): string;
    /**
      * `Create`
      */
    ["com.yunke.editCollection.button.create"](): string;
    /**
      * `Create collection`
      */
    ["com.yunke.editCollection.createCollection"](): string;
    /**
      * `Filters`
      */
    ["com.yunke.editCollection.filters"](): string;
    /**
      * `Docs`
      */
    ["com.yunke.editCollection.pages"](): string;
    /**
      * `Clear selected`
      */
    ["com.yunke.editCollection.pages.clear"](): string;
    /**
      * `Rename collection`
      */
    ["com.yunke.editCollection.renameCollection"](): string;
    /**
      * `Rules`
      */
    ["com.yunke.editCollection.rules"](): string;
    /**
      * `No results`
      */
    ["com.yunke.editCollection.rules.empty.noResults"](): string;
    /**
      * `No docs meet the filtering rules`
      */
    ["com.yunke.editCollection.rules.empty.noResults.tips"](): string;
    /**
      * `No rules`
      */
    ["com.yunke.editCollection.rules.empty.noRules"](): string;
    /**
      * `Add selected doc`
      */
    ["com.yunke.editCollection.rules.include.add"](): string;
    /**
      * `is`
      */
    ["com.yunke.editCollection.rules.include.is"](): string;
    /**
      * `is-not`
      */
    ["com.yunke.editCollection.rules.include.is-not"](): string;
    /**
      * `Doc`
      */
    ["com.yunke.editCollection.rules.include.page"](): string;
    /**
      * `“Selected docs” refers to manually adding docs rather than automatically adding them through rule matching. You can manually add docs through the “Add selected docs” option or by dragging and dropping.`
      */
    ["com.yunke.editCollection.rules.include.tips"](): string;
    /**
      * `What is "Selected docs"？`
      */
    ["com.yunke.editCollection.rules.include.tipsTitle"](): string;
    /**
      * `Selected docs`
      */
    ["com.yunke.editCollection.rules.include.title"](): string;
    /**
      * `Preview`
      */
    ["com.yunke.editCollection.rules.preview"](): string;
    /**
      * `Reset`
      */
    ["com.yunke.editCollection.rules.reset"](): string;
    /**
      * `automatically`
      */
    ["com.yunke.editCollection.rules.tips.highlight"](): string;
    /**
      * `Save`
      */
    ["com.yunke.editCollection.save"](): string;
    /**
      * `Save as new collection`
      */
    ["com.yunke.editCollection.saveCollection"](): string;
    /**
      * `Search doc...`
      */
    ["com.yunke.editCollection.search.placeholder"](): string;
    /**
      * `Untitled collection`
      */
    ["com.yunke.editCollection.untitledCollection"](): string;
    /**
      * `Update collection`
      */
    ["com.yunke.editCollection.updateCollection"](): string;
    /**
      * `Collection is a smart folder where you can manually add docs or automatically add docs through rules.`
      */
    ["com.yunke.editCollectionName.createTips"](): string;
    /**
      * `Name`
      */
    ["com.yunke.editCollectionName.name"](): string;
    /**
      * `Collection name`
      */
    ["com.yunke.editCollectionName.name.placeholder"](): string;
    /**
      * `Default to Edgeless mode`
      */
    ["com.yunke.editorDefaultMode.edgeless"](): string;
    /**
      * `Default to Page mode`
      */
    ["com.yunke.editorDefaultMode.page"](): string;
    /**
      * `Add docs`
      */
    ["com.yunke.empty.collection-detail.action.add-doc"](): string;
    /**
      * `Add rules`
      */
    ["com.yunke.empty.collection-detail.action.add-rule"](): string;
    /**
      * `Collection is a smart folder where you can manually add docs or automatically add docs through rules.`
      */
    ["com.yunke.empty.collection-detail.description"](): string;
    /**
      * `Empty collection`
      */
    ["com.yunke.empty.collection-detail.title"](): string;
    /**
      * `Add collection`
      */
    ["com.yunke.empty.collections.action.new-collection"](): string;
    /**
      * `Create your first collection here.`
      */
    ["com.yunke.empty.collections.description"](): string;
    /**
      * `Collection management`
      */
    ["com.yunke.empty.collections.title"](): string;
    /**
      * `New doc`
      */
    ["com.yunke.empty.docs.action.new-doc"](): string;
    /**
      * `Create your first doc here.`
      */
    ["com.yunke.empty.docs.all-description"](): string;
    /**
      * `Docs management`
      */
    ["com.yunke.empty.docs.title"](): string;
    /**
      * `Deleted docs will appear here.`
      */
    ["com.yunke.empty.docs.trash-description"](): string;
    /**
      * `Create a new tag for your documents.`
      */
    ["com.yunke.empty.tags.description"](): string;
    /**
      * `Tag management`
      */
    ["com.yunke.empty.tags.title"](): string;
    /**
      * `There's no doc here yet`
      */
    ["com.yunke.emptyDesc"](): string;
    /**
      * `Cancel`
      */
    ["com.yunke.enableYunkeCloudModal.button.cancel"](): string;
    /**
      * `Enable Cloud for {{workspaceName}}`
      */
    ["com.yunke.enableYunkeCloudModal.custom-server.title"](options: {
        readonly workspaceName: string;
    }): string;
    /**
      * `Choose an instance.`
      */
    ["com.yunke.enableYunkeCloudModal.custom-server.description"](): string;
    /**
      * `Enable Cloud`
      */
    ["com.yunke.enableYunkeCloudModal.custom-server.enable"](): string;
    /**
      * `Hide error`
      */
    ["com.yunke.error.hide-error"](): string;
    /**
      * `Doc content is missing`
      */
    ["com.yunke.error.no-page-root.title"](): string;
    /**
      * `It takes longer to load the doc content.`
      */
    ["com.yunke.error.loading-timeout-error"](): string;
    /**
      * `Refetch`
      */
    ["com.yunke.error.refetch"](): string;
    /**
      * `Reload YUNKE`
      */
    ["com.yunke.error.reload"](): string;
    /**
      * `Refresh`
      */
    ["com.yunke.error.retry"](): string;
    /**
      * `Something is wrong...`
      */
    ["com.yunke.error.unexpected-error.title"](): string;
    /**
      * `Please request a new reset password link.`
      */
    ["com.yunke.expired.page.subtitle"](): string;
    /**
      * `Please request a new link.`
      */
    ["com.yunke.expired.page.new-subtitle"](): string;
    /**
      * `This link has expired...`
      */
    ["com.yunke.expired.page.title"](): string;
    /**
      * `Please try it again later.`
      */
    ["com.yunke.export.error.message"](): string;
    /**
      * `Export failed due to an unexpected error`
      */
    ["com.yunke.export.error.title"](): string;
    /**
      * `Print`
      */
    ["com.yunke.export.print"](): string;
    /**
      * `Please open the download folder to check.`
      */
    ["com.yunke.export.success.message"](): string;
    /**
      * `Exported successfully`
      */
    ["com.yunke.export.success.title"](): string;
    /**
      * `Add to favourites`
      */
    ["com.yunke.favoritePageOperation.add"](): string;
    /**
      * `Remove from favourites`
      */
    ["com.yunke.favoritePageOperation.remove"](): string;
    /**
      * `Filter`
      */
    ["com.yunke.filter"](): string;
    /**
      * `Add Filter Rule`
      */
    ["com.yunke.filter.add-filter"](): string;
    /**
      * `after`
      */
    ["com.yunke.filter.after"](): string;
    /**
      * `before`
      */
    ["com.yunke.filter.before"](): string;
    /**
      * `contains all`
      */
    ["com.yunke.filter.contains all"](): string;
    /**
      * `contains one of`
      */
    ["com.yunke.filter.contains one of"](): string;
    /**
      * `does not contains all`
      */
    ["com.yunke.filter.does not contains all"](): string;
    /**
      * `does not contains one of`
      */
    ["com.yunke.filter.does not contains one of"](): string;
    /**
      * `Empty`
      */
    ["com.yunke.filter.empty-tag"](): string;
    /**
      * `Empty`
      */
    ["com.yunke.filter.empty"](): string;
    /**
      * `false`
      */
    ["com.yunke.filter.false"](): string;
    /**
      * `is`
      */
    ["com.yunke.filter.is"](): string;
    /**
      * `is empty`
      */
    ["com.yunke.filter.is empty"](): string;
    /**
      * `is not empty`
      */
    ["com.yunke.filter.is not empty"](): string;
    /**
      * `Favourited`
      */
    ["com.yunke.filter.is-favourited"](): string;
    /**
      * `Shared`
      */
    ["com.yunke.filter.is-public"](): string;
    /**
      * `between`
      */
    ["com.yunke.filter.between"](): string;
    /**
      * `last 3 days`
      */
    ["com.yunke.filter.last 3 days"](): string;
    /**
      * `last 7 days`
      */
    ["com.yunke.filter.last 7 days"](): string;
    /**
      * `last 15 days`
      */
    ["com.yunke.filter.last 15 days"](): string;
    /**
      * `last 30 days`
      */
    ["com.yunke.filter.last 30 days"](): string;
    /**
      * `this week`
      */
    ["com.yunke.filter.this week"](): string;
    /**
      * `this month`
      */
    ["com.yunke.filter.this month"](): string;
    /**
      * `this quarter`
      */
    ["com.yunke.filter.this quarter"](): string;
    /**
      * `this year`
      */
    ["com.yunke.filter.this year"](): string;
    /**
      * `last`
      */
    ["com.yunke.filter.last"](): string;
    /**
      * `Save view`
      */
    ["com.yunke.filter.save-view"](): string;
    /**
      * `true`
      */
    ["com.yunke.filter.true"](): string;
    /**
      * `Add filter`
      */
    ["com.yunke.filterList.button.add"](): string;
    /**
      * `Display`
      */
    ["com.yunke.explorer.display-menu.button"](): string;
    /**
      * `Grouping`
      */
    ["com.yunke.explorer.display-menu.grouping"](): string;
    /**
      * `Remove group`
      */
    ["com.yunke.explorer.display-menu.grouping.remove"](): string;
    /**
      * `Ordering`
      */
    ["com.yunke.explorer.display-menu.ordering"](): string;
    /**
      * `View in Page mode`
      */
    ["com.yunke.header.mode-switch.page"](): string;
    /**
      * `View in Edgeless Canvas`
      */
    ["com.yunke.header.mode-switch.edgeless"](): string;
    /**
      * `Add tag`
      */
    ["com.yunke.header.option.add-tag"](): string;
    /**
      * `Duplicate`
      */
    ["com.yunke.header.option.duplicate"](): string;
    /**
      * `Open in desktop app`
      */
    ["com.yunke.header.option.open-in-desktop"](): string;
    /**
      * `View all frames`
      */
    ["com.yunke.header.option.view-frame"](): string;
    /**
      * `View table of contents`
      */
    ["com.yunke.header.option.view-toc"](): string;
    /**
      * `Table of contents`
      */
    ["com.yunke.header.menu.toc"](): string;
    /**
      * `Contact us`
      */
    ["com.yunke.helpIsland.contactUs"](): string;
    /**
      * `Getting started`
      */
    ["com.yunke.helpIsland.gettingStarted"](): string;
    /**
      * `Help and feedback`
      */
    ["com.yunke.helpIsland.helpAndFeedback"](): string;
    /**
      * `Cancel`
      */
    ["com.yunke.history-vision.tips-modal.cancel"](): string;
    /**
      * `Enable YUNKE Cloud`
      */
    ["com.yunke.history-vision.tips-modal.confirm"](): string;
    /**
      * `The current workspace is a local workspace, and we do not support version history for it at the moment. You can enable YUNKE Cloud. This will sync the workspace with the Cloud, allowing you to use this feature.`
      */
    ["com.yunke.history-vision.tips-modal.description"](): string;
    /**
      * `History vision needs YUNKE Cloud`
      */
    ["com.yunke.history-vision.tips-modal.title"](): string;
    /**
      * `Back to doc`
      */
    ["com.yunke.history.back-to-page"](): string;
    /**
      * `You are about to restore the current version of the doc to the latest version available. This action will overwrite any changes made prior to the latest version.`
      */
    ["com.yunke.history.confirm-restore-modal.hint"](): string;
    /**
      * `Load more`
      */
    ["com.yunke.history.confirm-restore-modal.load-more"](): string;
    /**
      * `LIMITED DOC HISTORY`
      */
    ["com.yunke.history.confirm-restore-modal.plan-prompt.limited-title"](): string;
    /**
      * `HELP INFO`
      */
    ["com.yunke.history.confirm-restore-modal.plan-prompt.title"](): string;
    /**
      * `Upgrade`
      */
    ["com.yunke.history.confirm-restore-modal.pro-plan-prompt.upgrade"](): string;
    /**
      * `Restore`
      */
    ["com.yunke.history.confirm-restore-modal.restore"](): string;
    /**
      * `This document is such a spring chicken, it hasn't sprouted a single historical sprig yet!`
      */
    ["com.yunke.history.empty-prompt.description"](): string;
    /**
      * `Empty`
      */
    ["com.yunke.history.empty-prompt.title"](): string;
    /**
      * `Restore current version`
      */
    ["com.yunke.history.restore-current-version"](): string;
    /**
      * `Version history`
      */
    ["com.yunke.history.version-history"](): string;
    /**
      * `View history version`
      */
    ["com.yunke.history.view-history-version"](): string;
    /**
      * `Create into a New Workspace`
      */
    ["com.yunke.import-template.dialog.createDocToNewWorkspace"](): string;
    /**
      * `Create doc to "{{workspace}}"`
      */
    ["com.yunke.import-template.dialog.createDocToWorkspace"](options: {
        readonly workspace: string;
    }): string;
    /**
      * `Create doc with "{{templateName}}" template`
      */
    ["com.yunke.import-template.dialog.createDocWithTemplate"](options: {
        readonly templateName: string;
    }): string;
    /**
      * `Failed to import template, please try again.`
      */
    ["com.yunke.import-template.dialog.errorImport"](): string;
    /**
      * `Failed to load template, please try again.`
      */
    ["com.yunke.import-template.dialog.errorLoad"](): string;
    /**
      * `Create into a New Workspace`
      */
    ["com.yunke.import-clipper.dialog.createDocToNewWorkspace"](): string;
    /**
      * `Create doc to "{{workspace}}"`
      */
    ["com.yunke.import-clipper.dialog.createDocToWorkspace"](options: {
        readonly workspace: string;
    }): string;
    /**
      * `Create doc from Web Clipper`
      */
    ["com.yunke.import-clipper.dialog.createDocFromClipper"](): string;
    /**
      * `Failed to import content, please try again.`
      */
    ["com.yunke.import-clipper.dialog.errorImport"](): string;
    /**
      * `Failed to load content, please try again.`
      */
    ["com.yunke.import-clipper.dialog.errorLoad"](): string;
    /**
      * `Support Markdown/Notion`
      */
    ["com.yunke.import_file"](): string;
    /**
      * `YUNKE workspace data`
      */
    ["com.yunke.import.yunke-workspace-data"](): string;
    /**
      * `HTML`
      */
    ["com.yunke.import.html-files"](): string;
    /**
      * `This is an experimental feature that is not perfect and may cause your data to be missing after import.`
      */
    ["com.yunke.import.html-files.tooltip"](): string;
    /**
      * `Markdown files (.md)`
      */
    ["com.yunke.import.markdown-files"](): string;
    /**
      * `Markdown with media files (.zip)`
      */
    ["com.yunke.import.markdown-with-media-files"](): string;
    /**
      * `Please upload a markdown zip file with attachments, experimental function, there may be data loss.`
      */
    ["com.yunke.import.markdown-with-media-files.tooltip"](): string;
    /**
      * `If you'd like to request support for additional file types, feel free to let us know on`
      */
    ["com.yunke.import.modal.tip"](): string;
    /**
      * `Notion`
      */
    ["com.yunke.import.notion"](): string;
    /**
      * `Import your Notion data. Supported import formats: HTML with subpages.`
      */
    ["com.yunke.import.notion.tooltip"](): string;
    /**
      * `Snapshot`
      */
    ["com.yunke.import.snapshot"](): string;
    /**
      * `Import your YUNKE workspace and page snapshot file.`
      */
    ["com.yunke.import.snapshot.tooltip"](): string;
    /**
      * `Import failed, please try again.`
      */
    ["com.yunke.import.status.failed.message"](): string;
    /**
      * `No file selected`
      */
    ["com.yunke.import.status.failed.message.no-file-selected"](): string;
    /**
      * `Import failure`
      */
    ["com.yunke.import.status.failed.title"](): string;
    /**
      * `Importing your workspace data, please wait patiently.`
      */
    ["com.yunke.import.status.importing.message"](): string;
    /**
      * `Importing...`
      */
    ["com.yunke.import.status.importing.title"](): string;
    /**
      * `Your document has been imported successfully, thank you for choosing YUNKE. Any questions please feel free to feedback to us`
      */
    ["com.yunke.import.status.success.message"](): string;
    /**
      * `Import completed`
      */
    ["com.yunke.import.status.success.title"](): string;
    /**
      * `Cancel`
      */
    ["com.yunke.inviteModal.button.cancel"](): string;
    /**
      * `Maybe later`
      */
    ["com.yunke.issue-feedback.cancel"](): string;
    /**
      * `Create issue on GitHub`
      */
    ["com.yunke.issue-feedback.confirm"](): string;
    /**
      * `Got feedback? We're all ears! Create an issue on GitHub to let us know your thoughts and suggestions`
      */
    ["com.yunke.issue-feedback.description"](): string;
    /**
      * `Share your feedback on GitHub`
      */
    ["com.yunke.issue-feedback.title"](): string;
    /**
      * `Journals`
      */
    ["com.yunke.journal.app-sidebar-title"](): string;
    /**
      * `{{count}} more articles`
      */
    ["com.yunke.journal.conflict-show-more"](options: {
        readonly count: string;
    }): string;
    /**
      * `Created`
      */
    ["com.yunke.journal.created-today"](): string;
    /**
      * `You haven't created anything yet`
      */
    ["com.yunke.journal.daily-count-created-empty-tips"](): string;
    /**
      * `You haven't updated anything yet`
      */
    ["com.yunke.journal.daily-count-updated-empty-tips"](): string;
    /**
      * `Updated`
      */
    ["com.yunke.journal.updated-today"](): string;
    /**
      * `Just now`
      */
    ["com.yunke.just-now"](): string;
    /**
      * `Append to daily note`
      */
    ["com.yunke.keyboardShortcuts.appendDailyNote"](): string;
    /**
      * `Body text`
      */
    ["com.yunke.keyboardShortcuts.bodyText"](): string;
    /**
      * `Bold`
      */
    ["com.yunke.keyboardShortcuts.bold"](): string;
    /**
      * `Cancel`
      */
    ["com.yunke.keyboardShortcuts.cancel"](): string;
    /**
      * `Code block`
      */
    ["com.yunke.keyboardShortcuts.codeBlock"](): string;
    /**
      * `Copy private link`
      */
    ["com.yunke.keyboardShortcuts.copy-private-link"](): string;
    /**
      * `Connector`
      */
    ["com.yunke.keyboardShortcuts.connector"](): string;
    /**
      * `Divider`
      */
    ["com.yunke.keyboardShortcuts.divider"](): string;
    /**
      * `Expand/collapse sidebar`
      */
    ["com.yunke.keyboardShortcuts.expandOrCollapseSidebar"](): string;
    /**
      * `Go back`
      */
    ["com.yunke.keyboardShortcuts.goBack"](): string;
    /**
      * `Go forward`
      */
    ["com.yunke.keyboardShortcuts.goForward"](): string;
    /**
      * `Group`
      */
    ["com.yunke.keyboardShortcuts.group"](): string;
    /**
      * `Group as database`
      */
    ["com.yunke.keyboardShortcuts.groupDatabase"](): string;
    /**
      * `Hand`
      */
    ["com.yunke.keyboardShortcuts.hand"](): string;
    /**
      * `Heading {{number}}`
      */
    ["com.yunke.keyboardShortcuts.heading"](options: {
        readonly number: string;
    }): string;
    /**
      * `Image`
      */
    ["com.yunke.keyboardShortcuts.image"](): string;
    /**
      * `Increase indent`
      */
    ["com.yunke.keyboardShortcuts.increaseIndent"](): string;
    /**
      * `Inline code`
      */
    ["com.yunke.keyboardShortcuts.inlineCode"](): string;
    /**
      * `Italic`
      */
    ["com.yunke.keyboardShortcuts.italic"](): string;
    /**
      * `Hyperlink (with selected text)`
      */
    ["com.yunke.keyboardShortcuts.link"](): string;
    /**
      * `Move down`
      */
    ["com.yunke.keyboardShortcuts.moveDown"](): string;
    /**
      * `Move up`
      */
    ["com.yunke.keyboardShortcuts.moveUp"](): string;
    /**
      * `New doc`
      */
    ["com.yunke.keyboardShortcuts.newPage"](): string;
    /**
      * `Note`
      */
    ["com.yunke.keyboardShortcuts.note"](): string;
    /**
      * `Pen`
      */
    ["com.yunke.keyboardShortcuts.pen"](): string;
    /**
      * `Quick search`
      */
    ["com.yunke.keyboardShortcuts.quickSearch"](): string;
    /**
      * `Redo`
      */
    ["com.yunke.keyboardShortcuts.redo"](): string;
    /**
      * `Reduce indent`
      */
    ["com.yunke.keyboardShortcuts.reduceIndent"](): string;
    /**
      * `Select`
      */
    ["com.yunke.keyboardShortcuts.select"](): string;
    /**
      * `Select all`
      */
    ["com.yunke.keyboardShortcuts.selectAll"](): string;
    /**
      * `Shape`
      */
    ["com.yunke.keyboardShortcuts.shape"](): string;
    /**
      * `Strikethrough`
      */
    ["com.yunke.keyboardShortcuts.strikethrough"](): string;
    /**
      * `Check keyboard shortcuts quickly`
      */
    ["com.yunke.keyboardShortcuts.subtitle"](): string;
    /**
      * `Switch view`
      */
    ["com.yunke.keyboardShortcuts.switch"](): string;
    /**
      * `Text`
      */
    ["com.yunke.keyboardShortcuts.text"](): string;
    /**
      * `Keyboard shortcuts`
      */
    ["com.yunke.keyboardShortcuts.title"](): string;
    /**
      * `Ungroup`
      */
    ["com.yunke.keyboardShortcuts.unGroup"](): string;
    /**
      * `Underline`
      */
    ["com.yunke.keyboardShortcuts.underline"](): string;
    /**
      * `Undo`
      */
    ["com.yunke.keyboardShortcuts.undo"](): string;
    /**
      * `Zoom in`
      */
    ["com.yunke.keyboardShortcuts.zoomIn"](): string;
    /**
      * `Zoom out`
      */
    ["com.yunke.keyboardShortcuts.zoomOut"](): string;
    /**
      * `Zoom to 100%`
      */
    ["com.yunke.keyboardShortcuts.zoomTo100"](): string;
    /**
      * `Zoom to fit`
      */
    ["com.yunke.keyboardShortcuts.zoomToFit"](): string;
    /**
      * `Zoom to selection`
      */
    ["com.yunke.keyboardShortcuts.zoomToSelection"](): string;
    /**
      * `Last 30 days`
      */
    ["com.yunke.last30Days"](): string;
    /**
      * `Last 7 days`
      */
    ["com.yunke.last7Days"](): string;
    /**
      * `Last month`
      */
    ["com.yunke.lastMonth"](): string;
    /**
      * `Last week`
      */
    ["com.yunke.lastWeek"](): string;
    /**
      * `Last year`
      */
    ["com.yunke.lastYear"](): string;
    /**
      * `Loading`
      */
    ["com.yunke.loading"](): string;
    /**
      * `Loading document content, please wait a moment.`
      */
    ["com.yunke.loading.description"](): string;
    /**
      * `Rename`
      */
    ["com.yunke.menu.rename"](): string;
    /**
      * `No results found`
      */
    ["com.yunke.mobile.search.empty"](): string;
    /**
      * `App version`
      */
    ["com.yunke.mobile.setting.about.appVersion"](): string;
    /**
      * `Editor version`
      */
    ["com.yunke.mobile.setting.about.editorVersion"](): string;
    /**
      * `About`
      */
    ["com.yunke.mobile.setting.about.title"](): string;
    /**
      * `Font style`
      */
    ["com.yunke.mobile.setting.appearance.font"](): string;
    /**
      * `Display language`
      */
    ["com.yunke.mobile.setting.appearance.language"](): string;
    /**
      * `Color mode`
      */
    ["com.yunke.mobile.setting.appearance.theme"](): string;
    /**
      * `Appearance`
      */
    ["com.yunke.mobile.setting.appearance.title"](): string;
    /**
      * `Settings`
      */
    ["com.yunke.mobile.setting.header-title"](): string;
    /**
      * `Star us on GitHub`
      */
    ["com.yunke.mobile.setting.others.github"](): string;
    /**
      * `Privacy`
      */
    ["com.yunke.mobile.setting.others.privacy"](): string;
    /**
      * `Terms of use`
      */
    ["com.yunke.mobile.setting.others.terms"](): string;
    /**
      * `Privacy & others`
      */
    ["com.yunke.mobile.setting.others.title"](): string;
    /**
      * `Official website`
      */
    ["com.yunke.mobile.setting.others.website"](): string;
    /**
      * `Want to keep data local?`
      */
    ["com.yunke.mobile.sign-in.skip.hint"](): string;
    /**
      * `Start YUNKE without an account`
      */
    ["com.yunke.mobile.sign-in.skip.link"](): string;
    /**
      * `Older than a month`
      */
    ["com.yunke.moreThan30Days"](): string;
    /**
      * `Cancel`
      */
    ["com.yunke.moveToTrash.confirmModal.cancel"](): string;
    /**
      * `Delete`
      */
    ["com.yunke.moveToTrash.confirmModal.confirm"](): string;
    /**
      * `{{title}} will be moved to trash`
      */
    ["com.yunke.moveToTrash.confirmModal.description"](options: {
        readonly title: string;
    }): string;
    /**
      * `{{ number }} docs will be moved to Trash`
      */
    ["com.yunke.moveToTrash.confirmModal.description.multiple"](options: {
        readonly number: string;
    }): string;
    /**
      * `Delete doc?`
      */
    ["com.yunke.moveToTrash.confirmModal.title"](): string;
    /**
      * `Delete {{ number }} docs?`
      */
    ["com.yunke.moveToTrash.confirmModal.title.multiple"](options: {
        readonly number: string;
    }): string;
    /**
      * `Move to trash`
      */
    ["com.yunke.moveToTrash.title"](): string;
    /**
      * `New tab`
      */
    ["com.yunke.multi-tab.new-tab"](): string;
    /**
      * `Enabling YUNKE Cloud allows you to synchronise and backup data, as well as support multi-user collaboration and content publishing.`
      */
    ["com.yunke.nameWorkspace.yunke-cloud.description"](): string;
    /**
      * `Sync across devices with YUNKE Cloud`
      */
    ["com.yunke.nameWorkspace.yunke-cloud.title"](): string;
    /**
      * `If you want the workspace to be stored locally, you can download the desktop client.`
      */
    ["com.yunke.nameWorkspace.yunke-cloud.web-tips"](): string;
    /**
      * `Cancel`
      */
    ["com.yunke.nameWorkspace.button.cancel"](): string;
    /**
      * `Create`
      */
    ["com.yunke.nameWorkspace.button.create"](): string;
    /**
      * `A workspace is your virtual space to capture, create and plan as just one person or together as a team.`
      */
    ["com.yunke.nameWorkspace.description"](): string;
    /**
      * `Set a workspace name`
      */
    ["com.yunke.nameWorkspace.placeholder"](): string;
    /**
      * `Workspace name`
      */
    ["com.yunke.nameWorkspace.subtitle.workspace-name"](): string;
    /**
      * `Workspace type`
      */
    ["com.yunke.nameWorkspace.subtitle.workspace-type"](): string;
    /**
      * `Name your workspace`
      */
    ["com.yunke.nameWorkspace.title"](): string;
    /**
      * `New page`
      */
    ["com.yunke.new.page-mode"](): string;
    /**
      * `New edgeless`
      */
    ["com.yunke.new_edgeless"](): string;
    /**
      * `Import`
      */
    ["com.yunke.new_import"](): string;
    /**
      * `Next week`
      */
    ["com.yunke.nextWeek"](): string;
    /**
      * `Back home`
      */
    ["com.yunke.notFoundPage.backButton"](): string;
    /**
      * `Page not found`
      */
    ["com.yunke.notFoundPage.title"](): string;
    /**
      * `YUNKE Community`
      */
    ["com.yunke.other-page.nav.yunke-community"](): string;
    /**
      * `Blog`
      */
    ["com.yunke.other-page.nav.blog"](): string;
    /**
      * `Contact us`
      */
    ["com.yunke.other-page.nav.contact-us"](): string;
    /**
      * `Download app`
      */
    ["com.yunke.other-page.nav.download-app"](): string;
    /**
      * `Official website`
      */
    ["com.yunke.other-page.nav.official-website"](): string;
    /**
      * `Open YUNKE`
      */
    ["com.yunke.other-page.nav.open-yunke"](): string;
    /**
      * `Add linked doc`
      */
    ["com.yunke.page-operation.add-linked-page"](): string;
    /**
      * `{{ count }} more properties`
      */
    ["com.yunke.page-properties.more-property.more"](options: {
        readonly count: string;
    }): string;
    /**
      * `{{ count }} more property`
      */
    ["com.yunke.page-properties.more-property.one"](options: {
        readonly count: string;
    }): string;
    /**
      * `hide {{ count }} property`
      */
    ["com.yunke.page-properties.hide-property.one"](options: {
        readonly count: string;
    }): string;
    /**
      * `hide {{ count }} properties`
      */
    ["com.yunke.page-properties.hide-property.more"](options: {
        readonly count: string;
    }): string;
    /**
      * `Add property`
      */
    ["com.yunke.page-properties.add-property"](): string;
    /**
      * `Create property`
      */
    ["com.yunke.page-properties.add-property.menu.create"](): string;
    /**
      * `Properties`
      */
    ["com.yunke.page-properties.add-property.menu.header"](): string;
    /**
      * `Config properties`
      */
    ["com.yunke.page-properties.config-properties"](): string;
    /**
      * `Backlinks`
      */
    ["com.yunke.page-properties.backlinks"](): string;
    /**
      * `Type`
      */
    ["com.yunke.page-properties.create-property.menu.header"](): string;
    /**
      * `Added`
      */
    ["com.yunke.page-properties.create-property.added"](): string;
    /**
      * `Icons`
      */
    ["com.yunke.page-properties.icons"](): string;
    /**
      * `Local user`
      */
    ["com.yunke.page-properties.local-user"](): string;
    /**
      * `Outgoing links`
      */
    ["com.yunke.page-properties.outgoing-links"](): string;
    /**
      * `Info`
      */
    ["com.yunke.page-properties.page-info"](): string;
    /**
      * `View Info`
      */
    ["com.yunke.page-properties.page-info.view"](): string;
    /**
      * `No Record`
      */
    ["com.yunke.page-properties.property-user-avatar-no-record"](): string;
    /**
      * `Local User`
      */
    ["com.yunke.page-properties.property-user-local"](): string;
    /**
      * `Empty`
      */
    ["com.yunke.page-properties.property-value-placeholder"](): string;
    /**
      * `Always hide`
      */
    ["com.yunke.page-properties.property.always-hide"](): string;
    /**
      * `Always show`
      */
    ["com.yunke.page-properties.property.always-show"](): string;
    /**
      * `Checkbox`
      */
    ["com.yunke.page-properties.property.checkbox"](): string;
    /**
      * `Created by`
      */
    ["com.yunke.page-properties.property.createdBy"](): string;
    /**
      * `Date`
      */
    ["com.yunke.page-properties.property.date"](): string;
    /**
      * `Hide in view`
      */
    ["com.yunke.page-properties.property.hide-in-view"](): string;
    /**
      * `Hide in view when empty`
      */
    ["com.yunke.page-properties.property.hide-in-view-when-empty"](): string;
    /**
      * `Hide when empty`
      */
    ["com.yunke.page-properties.property.hide-when-empty"](): string;
    /**
      * `Number`
      */
    ["com.yunke.page-properties.property.number"](): string;
    /**
      * `Progress`
      */
    ["com.yunke.page-properties.property.progress"](): string;
    /**
      * `Remove property`
      */
    ["com.yunke.page-properties.property.remove-property"](): string;
    /**
      * `Required`
      */
    ["com.yunke.page-properties.property.required"](): string;
    /**
      * `Show in view`
      */
    ["com.yunke.page-properties.property.show-in-view"](): string;
    /**
      * `Tags`
      */
    ["com.yunke.page-properties.property.tags"](): string;
    /**
      * `Doc mode`
      */
    ["com.yunke.page-properties.property.docPrimaryMode"](): string;
    /**
      * `Text`
      */
    ["com.yunke.page-properties.property.text"](): string;
    /**
      * `Journal`
      */
    ["com.yunke.page-properties.property.journal"](): string;
    /**
      * `Duplicated`
      */
    ["com.yunke.page-properties.property.journal-duplicated"](): string;
    /**
      * `Remove journal mark`
      */
    ["com.yunke.page-properties.property.journal-remove"](): string;
    /**
      * `Last edited by`
      */
    ["com.yunke.page-properties.property.updatedBy"](): string;
    /**
      * `Created`
      */
    ["com.yunke.page-properties.property.createdAt"](): string;
    /**
      * `Updated`
      */
    ["com.yunke.page-properties.property.updatedAt"](): string;
    /**
      * `Edgeless theme`
      */
    ["com.yunke.page-properties.property.edgelessTheme"](): string;
    /**
      * `Page width`
      */
    ["com.yunke.page-properties.property.pageWidth"](): string;
    /**
      * `Template`
      */
    ["com.yunke.page-properties.property.template"](): string;
    /**
      * `Add relevant identifiers or categories to the doc. Useful for organizing content, improving searchability, and grouping related docs together.`
      */
    ["com.yunke.page-properties.property.tags.tooltips"](): string;
    /**
      * `Indicates that this doc is a journal entry or daily note. Facilitates easy capture of ideas, quick logging of thoughts, and ongoing personal reflection.`
      */
    ["com.yunke.page-properties.property.journal.tooltips"](): string;
    /**
      * `Use a checkbox to indicate whether a condition is true or false. Useful for confirming options, toggling features, or tracking task states.`
      */
    ["com.yunke.page-properties.property.checkbox.tooltips"](): string;
    /**
      * `Use a date field to select or display a specific date. Useful for scheduling, setting deadlines, or recording important events.`
      */
    ["com.yunke.page-properties.property.date.tooltips"](): string;
    /**
      * `Upload images to display or manage them. Useful for showcasing visual content, adding illustrations, or organizing a gallery.`
      */
    ["com.yunke.page-properties.property.image.tooltips"](): string;
    /**
      * `Select one or more options. Useful for categorizing items, filtering data, or managing tags.`
      */
    ["com.yunke.page-properties.property.multiSelect.tooltips"](): string;
    /**
      * `Enter a numeric value. Useful for quantities, measurements, or ranking items.`
      */
    ["com.yunke.page-properties.property.number.tooltips"](): string;
    /**
      * `Set a progress value between 0 and 100. Useful for tracking completion status, visualizing progress, or managing goals.`
      */
    ["com.yunke.page-properties.property.progress.tooltips"](): string;
    /**
      * `Choose one option. Useful for selecting a single preference, categorizing items, or making decisions.`
      */
    ["com.yunke.page-properties.property.select.tooltips"](): string;
    /**
      * `Enter a link to websites or YUNKE docs. Useful for connecting to external resources and referencing internal docs.`
      */
    ["com.yunke.page-properties.property.link.tooltips"](): string;
    /**
      * `Enter text. Useful for descriptions, comments, notes, or any other free-form text input.`
      */
    ["com.yunke.page-properties.property.text.tooltips"](): string;
    /**
      * `Displays the author of the current doc. Useful for tracking doc ownership, accountability, and collaboration.`
      */
    ["com.yunke.page-properties.property.createdBy.tooltips"](): string;
    /**
      * `Displays the last editor of the current doc. Useful for tracking recent changes.`
      */
    ["com.yunke.page-properties.property.updatedBy.tooltips"](): string;
    /**
      * `Record the last modification timestamp. Useful for tracking changes, identifying recent updates, or monitoring content freshness.`
      */
    ["com.yunke.page-properties.property.updatedAt.tooltips"](): string;
    /**
      * `Track when a doc was first created. Useful for maintaining record history, sorting by creation date, or auditing content chronologically.`
      */
    ["com.yunke.page-properties.property.createdAt.tooltips"](): string;
    /**
      * `Select the doc mode from Page Mode, Edgeless Mode, or Auto. Useful for choosing the best display for your content.`
      */
    ["com.yunke.page-properties.property.docPrimaryMode.tooltips"](): string;
    /**
      * `Select the doc theme from Light, Dark, or System. Useful for precise control over content viewing style.`
      */
    ["com.yunke.page-properties.property.edgelessTheme.tooltips"](): string;
    /**
      * `Control the width of this page to fit content display needs.`
      */
    ["com.yunke.page-properties.property.pageWidth.tooltips"](): string;
    /**
      * `Mark this doc as a template, which can be used to create new docs.`
      */
    ["com.yunke.page-properties.property.template.tooltips"](): string;
    /**
      * `Created by {{userName}}`
      */
    ["com.yunke.page-properties.property.createdBy.tip"](options: {
        readonly userName: string;
    }): string;
    /**
      * `Last edited by {{userName}}`
      */
    ["com.yunke.page-properties.property.updatedBy.tip"](options: {
        readonly userName: string;
    }): string;
    /**
      * `Properties`
      */
    ["com.yunke.propertySidebar.property-list.section"](): string;
    /**
      * `Add more properties`
      */
    ["com.yunke.propertySidebar.add-more.section"](): string;
    /**
      * `customize properties`
      */
    ["com.yunke.page-properties.settings.title"](): string;
    /**
      * `Open tag page`
      */
    ["com.yunke.page-properties.tags.open-tags-page"](): string;
    /**
      * `Select tag or create one`
      */
    ["com.yunke.page-properties.tags.selector-header-title"](): string;
    /**
      * `Display`
      */
    ["com.yunke.page.display"](): string;
    /**
      * `Display properties`
      */
    ["com.yunke.page.display.display-properties"](): string;
    /**
      * `Body notes`
      */
    ["com.yunke.page.display.display-properties.body-notes"](): string;
    /**
      * `Grouping`
      */
    ["com.yunke.page.display.grouping"](): string;
    /**
      * `Favourites`
      */
    ["com.yunke.page.display.grouping.group-by-favourites"](): string;
    /**
      * `Tag`
      */
    ["com.yunke.page.display.grouping.group-by-tag"](): string;
    /**
      * `Untagged`
      */
    ["com.yunke.page.display.grouping.group-by-tag.untagged"](): string;
    /**
      * `No grouping`
      */
    ["com.yunke.page.display.grouping.no-grouping"](): string;
    /**
      * `List option`
      */
    ["com.yunke.page.display.list-option"](): string;
    /**
      * `Clear selection`
      */
    ["com.yunke.page.group-header.clear"](): string;
    /**
      * `Favourited`
      */
    ["com.yunke.page.group-header.favourited"](): string;
    /**
      * `Not favourited`
      */
    ["com.yunke.page.group-header.not-favourited"](): string;
    /**
      * `Select all`
      */
    ["com.yunke.page.group-header.select-all"](): string;
    /**
      * `Created by {{name}}`
      */
    ["com.yunke.page.toolbar.created_by"](options: {
        readonly name: string;
    }): string;
    /**
      * `Doc mode`
      */
    ["com.yunke.pageMode"](): string;
    /**
      * `all`
      */
    ["com.yunke.pageMode.all"](): string;
    /**
      * `Edgeless`
      */
    ["com.yunke.pageMode.edgeless"](): string;
    /**
      * `Page`
      */
    ["com.yunke.pageMode.page"](): string;
    /**
      * `Congratulations on your successful purchase of YUNKE AI! You're now empowered to refine your content, generate images, and craft comprehensive mindmaps directly within YUNKE AI, dramatically enhancing your productivity.`
      */
    ["com.yunke.payment.ai-upgrade-success-page.text"](): string;
    /**
      * `Purchase successful!`
      */
    ["com.yunke.payment.ai-upgrade-success-page.title"](): string;
    /**
      * `Cancel subscription`
      */
    ["com.yunke.payment.ai.action.cancel.button-label"](): string;
    /**
      * `Keep YUNKE AI`
      */
    ["com.yunke.payment.ai.action.cancel.confirm.cancel-text"](): string;
    /**
      * `Cancel subscription`
      */
    ["com.yunke.payment.ai.action.cancel.confirm.confirm-text"](): string;
    /**
      * `If you end your subscription now, you can still use YUNKE AI until the end of this billing period.`
      */
    ["com.yunke.payment.ai.action.cancel.confirm.description"](): string;
    /**
      * `Cancel subscription`
      */
    ["com.yunke.payment.ai.action.cancel.confirm.title"](): string;
    /**
      * `Login`
      */
    ["com.yunke.payment.ai.action.login.button-label"](): string;
    /**
      * `Resume`
      */
    ["com.yunke.payment.ai.action.resume.button-label"](): string;
    /**
      * `Cancel`
      */
    ["com.yunke.payment.ai.action.resume.confirm.cancel-text"](): string;
    /**
      * `Confirm`
      */
    ["com.yunke.payment.ai.action.resume.confirm.confirm-text"](): string;
    /**
      * `Are you sure you want to resume the subscription for YUNKE AI? This means your payment method will be charged automatically at the end of each billing cycle, starting from the next billing cycle.`
      */
    ["com.yunke.payment.ai.action.resume.confirm.description"](): string;
    /**
      * `You will be charged in the next billing cycle.`
      */
    ["com.yunke.payment.ai.action.resume.confirm.notify.msg"](): string;
    /**
      * `Subscription updated`
      */
    ["com.yunke.payment.ai.action.resume.confirm.notify.title"](): string;
    /**
      * `Resume auto-renewal?`
      */
    ["com.yunke.payment.ai.action.resume.confirm.title"](): string;
    /**
      * `Write with you`
      */
    ["com.yunke.payment.ai.benefit.g1"](): string;
    /**
      * `Create quality content from sentences to articles on topics you need`
      */
    ["com.yunke.payment.ai.benefit.g1-1"](): string;
    /**
      * `Rewrite like the professionals`
      */
    ["com.yunke.payment.ai.benefit.g1-2"](): string;
    /**
      * `Change the tones / fix spelling & grammar`
      */
    ["com.yunke.payment.ai.benefit.g1-3"](): string;
    /**
      * `Draw with you`
      */
    ["com.yunke.payment.ai.benefit.g2"](): string;
    /**
      * `Visualize your mind, magically`
      */
    ["com.yunke.payment.ai.benefit.g2-1"](): string;
    /**
      * `Turn your outline into beautiful, engaging presentations`
      */
    ["com.yunke.payment.ai.benefit.g2-2"](): string;
    /**
      * `Summarize your content into structured mind-map`
      */
    ["com.yunke.payment.ai.benefit.g2-3"](): string;
    /**
      * `Plan with you`
      */
    ["com.yunke.payment.ai.benefit.g3"](): string;
    /**
      * `Memorize and tidy up your knowledge`
      */
    ["com.yunke.payment.ai.benefit.g3-1"](): string;
    /**
      * `Auto-sorting and auto-tagging`
      */
    ["com.yunke.payment.ai.benefit.g3-2"](): string;
    /**
      * `Open source & Privacy ensured`
      */
    ["com.yunke.payment.ai.benefit.g3-3"](): string;
    /**
      * `You have purchased YUNKE AI. The expiration date is {{end}}.`
      */
    ["com.yunke.payment.ai.billing-tip.end-at"](options: {
        readonly end: string;
    }): string;
    /**
      * `You have purchased YUNKE AI. The next payment date is {{due}}.`
      */
    ["com.yunke.payment.ai.billing-tip.next-bill-at"](options: {
        readonly due: string;
    }): string;
    /**
      * `Your recent payment failed, the next payment date is {{due}}.`
      */
    ["com.yunke.payment.billing-tip.past-due"](options: {
        readonly due: string;
    }): string;
    /**
      * `You are currently on the Free plan.`
      */
    ["com.yunke.payment.ai.pricing-plan.caption-free"](): string;
    /**
      * `You have purchased YUNKE AI`
      */
    ["com.yunke.payment.ai.pricing-plan.caption-purchased"](): string;
    /**
      * `Learn about YUNKE AI`
      */
    ["com.yunke.payment.ai.pricing-plan.learn"](): string;
    /**
      * `YUNKE AI`
      */
    ["com.yunke.payment.ai.pricing-plan.title"](): string;
    /**
      * `Turn all your ideas into reality`
      */
    ["com.yunke.payment.ai.pricing-plan.title-caption-1"](): string;
    /**
      * `A true multimodal AI copilot.`
      */
    ["com.yunke.payment.ai.pricing-plan.title-caption-2"](): string;
    /**
      * `Billed annually`
      */
    ["com.yunke.payment.ai.subscribe.billed-annually"](): string;
    /**
      * `You have purchased YUNKE AI.`
      */
    ["com.yunke.payment.ai.usage-description-purchased"](): string;
    /**
      * `YUNKE AI usage`
      */
    ["com.yunke.payment.ai.usage-title"](): string;
    /**
      * `Change plan`
      */
    ["com.yunke.payment.ai.usage.change-button-label"](): string;
    /**
      * `Purchase`
      */
    ["com.yunke.payment.ai.usage.purchase-button-label"](): string;
    /**
      * `Times used`
      */
    ["com.yunke.payment.ai.usage.used-caption"](): string;
    /**
      * `{{used}}/{{limit}} times`
      */
    ["com.yunke.payment.ai.usage.used-detail"](options: Readonly<{
        used: string;
        limit: string;
    }>): string;
    /**
      * `Active`
      */
    ["com.yunke.payment.subscription-status.active"](): string;
    /**
      * `Past-due bill`
      */
    ["com.yunke.payment.subscription-status.past-due"](): string;
    /**
      * `Trialing`
      */
    ["com.yunke.payment.subscription-status.trialing"](): string;
    /**
      * `Unlimited local workspaces`
      */
    ["com.yunke.payment.benefit-1"](): string;
    /**
      * `Unlimited login devices`
      */
    ["com.yunke.payment.benefit-2"](): string;
    /**
      * `Unlimited blocks`
      */
    ["com.yunke.payment.benefit-3"](): string;
    /**
      * `{{capacity}} of cloud storage`
      */
    ["com.yunke.payment.benefit-4"](options: {
        readonly capacity: string;
    }): string;
    /**
      * `{{capacity}} of maximum file size`
      */
    ["com.yunke.payment.benefit-5"](options: {
        readonly capacity: string;
    }): string;
    /**
      * `Number of members per workspace ≤ {{capacity}}`
      */
    ["com.yunke.payment.benefit-6"](options: {
        readonly capacity: string;
    }): string;
    /**
      * `{{capacity}}-days version history`
      */
    ["com.yunke.payment.benefit-7"](options: {
        readonly capacity: string;
    }): string;
    /**
      * `YUNKE AI`
      */
    ["com.yunke.payment.billing-setting.ai-plan"](): string;
    /**
      * `Purchase`
      */
    ["com.yunke.payment.billing-setting.ai.purchase"](): string;
    /**
      * `Start free trial`
      */
    ["com.yunke.payment.billing-setting.ai.start-free-trial"](): string;
    /**
      * `One-time payment`
      */
    ["com.yunke.payment.billing-setting.believer.price-caption"](): string;
    /**
      * `YUNKE Cloud`
      */
    ["com.yunke.payment.billing-setting.believer.title"](): string;
    /**
      * `Cancel subscription`
      */
    ["com.yunke.payment.billing-setting.cancel-subscription"](): string;
    /**
      * `Once you canceled subscription you will no longer enjoy the plan benefits.`
      */
    ["com.yunke.payment.billing-setting.cancel-subscription.description"](): string;
    /**
      * `Change plan`
      */
    ["com.yunke.payment.billing-setting.change-plan"](): string;
    /**
      * `YUNKE Cloud`
      */
    ["com.yunke.payment.billing-setting.current-plan"](): string;
    /**
      * `Expiration date`
      */
    ["com.yunke.payment.billing-setting.expiration-date"](): string;
    /**
      * `Your subscription is valid until {{expirationDate}}`
      */
    ["com.yunke.payment.billing-setting.expiration-date.description"](options: {
        readonly expirationDate: string;
    }): string;
    /**
      * `Billing history`
      */
    ["com.yunke.payment.billing-setting.history"](): string;
    /**
      * `Information`
      */
    ["com.yunke.payment.billing-setting.information"](): string;
    /**
      * `month`
      */
    ["com.yunke.payment.billing-setting.month"](): string;
    /**
      * `There are no invoices to display.`
      */
    ["com.yunke.payment.billing-setting.no-invoice"](): string;
    /**
      * `Paid`
      */
    ["com.yunke.payment.billing-setting.paid"](): string;
    /**
      * `Manage payment details`
      */
    ["com.yunke.payment.billing-setting.payment-method"](): string;
    /**
      * `View future and past invoices, update billing information, and change payment methods. Provided by Stripe.`
      */
    ["com.yunke.payment.billing-setting.payment-method.description"](): string;
    /**
      * `Go`
      */
    ["com.yunke.payment.billing-setting.payment-method.go"](): string;
    /**
      * `Renew date`
      */
    ["com.yunke.payment.billing-setting.renew-date"](): string;
    /**
      * `Next billing date: {{renewDate}}`
      */
    ["com.yunke.payment.billing-setting.renew-date.description"](options: {
        readonly renewDate: string;
    }): string;
    /**
      * `Due date`
      */
    ["com.yunke.payment.billing-setting.due-date"](): string;
    /**
      * `Your subscription will end on {{dueDate}}`
      */
    ["com.yunke.payment.billing-setting.due-date.description"](options: {
        readonly dueDate: string;
    }): string;
    /**
      * `Resume`
      */
    ["com.yunke.payment.billing-setting.resume-subscription"](): string;
    /**
      * `Manage your billing information and invoices`
      */
    ["com.yunke.payment.billing-setting.subtitle"](): string;
    /**
      * `Billing`
      */
    ["com.yunke.payment.billing-setting.title"](): string;
    /**
      * `Update`
      */
    ["com.yunke.payment.billing-setting.update"](): string;
    /**
      * `Upgrade`
      */
    ["com.yunke.payment.billing-setting.upgrade"](): string;
    /**
      * `View invoice`
      */
    ["com.yunke.payment.billing-setting.view-invoice"](): string;
    /**
      * `year`
      */
    ["com.yunke.payment.billing-setting.year"](): string;
    /**
      * `Please tell us more about your use case, to make YUNKE better.`
      */
    ["com.yunke.payment.billing-type-form.description"](): string;
    /**
      * `Go`
      */
    ["com.yunke.payment.billing-type-form.go"](): string;
    /**
      * `Tell us your use case`
      */
    ["com.yunke.payment.billing-type-form.title"](): string;
    /**
      * `You have reached the limit`
      */
    ["com.yunke.payment.blob-limit.title"](): string;
    /**
      * `Book a demo`
      */
    ["com.yunke.payment.book-a-demo"](): string;
    /**
      * `Buy Pro`
      */
    ["com.yunke.payment.buy-pro"](): string;
    /**
      * `Change to {{to}} Billing`
      */
    ["com.yunke.payment.change-to"](options: {
        readonly to: string;
    }): string;
    /**
      * `Include in FOSS`
      */
    ["com.yunke.payment.cloud.free.benefit.g1"](): string;
    /**
      * `Unlimited local workspaces`
      */
    ["com.yunke.payment.cloud.free.benefit.g1-1"](): string;
    /**
      * `Unlimited use and customization`
      */
    ["com.yunke.payment.cloud.free.benefit.g1-2"](): string;
    /**
      * `Unlimited doc and edgeless editing`
      */
    ["com.yunke.payment.cloud.free.benefit.g1-3"](): string;
    /**
      * `Include in Basic`
      */
    ["com.yunke.payment.cloud.free.benefit.g2"](): string;
    /**
      * `10 GB of cloud storage.`
      */
    ["com.yunke.payment.cloud.free.benefit.g2-1"](): string;
    /**
      * `10 MB of maximum file size.`
      */
    ["com.yunke.payment.cloud.free.benefit.g2-2"](): string;
    /**
      * `Up to 3 members per workspace.`
      */
    ["com.yunke.payment.cloud.free.benefit.g2-3"](): string;
    /**
      * `7-days cloud time machine file version history.`
      */
    ["com.yunke.payment.cloud.free.benefit.g2-4"](): string;
    /**
      * `Up to 3 login devices.`
      */
    ["com.yunke.payment.cloud.free.benefit.g2-5"](): string;
    /**
      * `Local Editor under MIT license.`
      */
    ["com.yunke.payment.cloud.free.description"](): string;
    /**
      * `Local FOSS + Cloud Basic`
      */
    ["com.yunke.payment.cloud.free.name"](): string;
    /**
      * `Free forever`
      */
    ["com.yunke.payment.cloud.free.title"](): string;
    /**
      * `Included in Pro plan`
      */
    ["com.yunke.payment.cloud.onetime.included"](): string;
    /**
      * `Included in Believer plan`
      */
    ["com.yunke.payment.cloud.lifetime.included"](): string;
    /**
      * `We host, no technical setup required.`
      */
    ["com.yunke.payment.cloud.pricing-plan.select.caption"](): string;
    /**
      * `Hosted by YUNKE.Pro`
      */
    ["com.yunke.payment.cloud.pricing-plan.select.title"](): string;
    /**
      * `Billed annually`
      */
    ["com.yunke.payment.cloud.pricing-plan.toggle-billed-yearly"](): string;
    /**
      * `Saving {{discount}}%`
      */
    ["com.yunke.payment.cloud.pricing-plan.toggle-discount"](options: {
        readonly discount: string;
    }): string;
    /**
      * `Annually`
      */
    ["com.yunke.payment.cloud.pricing-plan.toggle-yearly"](): string;
    /**
      * `Include in Pro`
      */
    ["com.yunke.payment.cloud.pro.benefit.g1"](): string;
    /**
      * `Everything in YUNKE FOSS & Basic.`
      */
    ["com.yunke.payment.cloud.pro.benefit.g1-1"](): string;
    /**
      * `100 GB of cloud storage.`
      */
    ["com.yunke.payment.cloud.pro.benefit.g1-2"](): string;
    /**
      * `100 MB of maximum file size.`
      */
    ["com.yunke.payment.cloud.pro.benefit.g1-3"](): string;
    /**
      * `Up to 10 members per workspace.`
      */
    ["com.yunke.payment.cloud.pro.benefit.g1-4"](): string;
    /**
      * `30-days cloud time machine file version history.`
      */
    ["com.yunke.payment.cloud.pro.benefit.g1-5"](): string;
    /**
      * `Add comments on Doc and Edgeless.`
      */
    ["com.yunke.payment.cloud.pro.benefit.g1-6"](): string;
    /**
      * `Community support.`
      */
    ["com.yunke.payment.cloud.pro.benefit.g1-7"](): string;
    /**
      * `Real-time syncing & collaboration for more people.`
      */
    ["com.yunke.payment.cloud.pro.benefit.g1-8"](): string;
    /**
      * `Granular edit access to docs.`
      */
    ["com.yunke.payment.cloud.pro.benefit.g1-9"](): string;
    /**
      * `For family and small teams.`
      */
    ["com.yunke.payment.cloud.pro.description"](): string;
    /**
      * `Pro`
      */
    ["com.yunke.payment.cloud.pro.name"](): string;
    /**
      * `annually`
      */
    ["com.yunke.payment.cloud.pro.title.billed-yearly"](): string;
    /**
      * `{{price}} per month`
      */
    ["com.yunke.payment.cloud.pro.title.price-monthly"](options: {
        readonly price: string;
    }): string;
    /**
      * `Include in Team Workspace`
      */
    ["com.yunke.payment.cloud.team-workspace.benefit.g1"](): string;
    /**
      * `Everything in YUNKE Pro.`
      */
    ["com.yunke.payment.cloud.team-workspace.benefit.g1-1"](): string;
    /**
      * `100 GB initial storage + 20 GB per seat.`
      */
    ["com.yunke.payment.cloud.team-workspace.benefit.g1-2"](): string;
    /**
      * `500 MB of maximum file size.`
      */
    ["com.yunke.payment.cloud.team-workspace.benefit.g1-3"](): string;
    /**
      * `Unlimited team members (10+ seats).`
      */
    ["com.yunke.payment.cloud.team-workspace.benefit.g1-4"](): string;
    /**
      * `Multiple admin roles.`
      */
    ["com.yunke.payment.cloud.team-workspace.benefit.g1-5"](): string;
    /**
      * `Priority customer support.`
      */
    ["com.yunke.payment.cloud.team-workspace.benefit.g1-6"](): string;
    /**
      * `Best for scalable teams.`
      */
    ["com.yunke.payment.cloud.team-workspace.description"](): string;
    /**
      * `Team`
      */
    ["com.yunke.payment.cloud.team-workspace.name"](): string;
    /**
      * `annually`
      */
    ["com.yunke.payment.cloud.team-workspace.title.billed-yearly"](): string;
    /**
      * `{{price}} per seat/month`
      */
    ["com.yunke.payment.cloud.team-workspace.title.price-monthly"](options: {
        readonly price: string;
    }): string;
    /**
      * `Contact sales`
      */
    ["com.yunke.payment.contact-sales"](): string;
    /**
      * `Current plan`
      */
    ["com.yunke.payment.current-plan"](): string;
    /**
      * `Start 14-day free trial`
      */
    ["com.yunke.payment.start-free-trial"](): string;
    /**
      * `{{amount}}% off`
      */
    ["com.yunke.payment.discount-amount"](options: {
        readonly amount: string;
    }): string;
    /**
      * `Downgrade`
      */
    ["com.yunke.payment.downgrade"](): string;
    /**
      * `We'd like to hear more about where we fall short, so that we can make YUNKE better.`
      */
    ["com.yunke.payment.downgraded-notify.content"](): string;
    /**
      * `Later`
      */
    ["com.yunke.payment.downgraded-notify.later"](): string;
    /**
      * `Sure, Open in browser`
      */
    ["com.yunke.payment.downgraded-notify.ok-client"](): string;
    /**
      * `Sure, Open in new tab`
      */
    ["com.yunke.payment.downgraded-notify.ok-web"](): string;
    /**
      * `Sorry to see you go`
      */
    ["com.yunke.payment.downgraded-notify.title"](): string;
    /**
      * `You have successfully downgraded. After the current billing period ends, your account will automatically switch to the Free plan.`
      */
    ["com.yunke.payment.downgraded-tooltip"](): string;
    /**
      * `Best team workspace for collaboration and knowledge distilling.`
      */
    ["com.yunke.payment.dynamic-benefit-1"](): string;
    /**
      * `Focusing on what really matters with team project management and automation.`
      */
    ["com.yunke.payment.dynamic-benefit-2"](): string;
    /**
      * `Pay for seats, fits all team size.`
      */
    ["com.yunke.payment.dynamic-benefit-3"](): string;
    /**
      * `Solutions & best practices for dedicated needs.`
      */
    ["com.yunke.payment.dynamic-benefit-4"](): string;
    /**
      * `Embedable & interrogations with IT support.`
      */
    ["com.yunke.payment.dynamic-benefit-5"](): string;
    /**
      * `Everything in YUNKE Pro`
      */
    ["com.yunke.payment.lifetime.benefit-1"](): string;
    /**
      * `Life-time personal usage`
      */
    ["com.yunke.payment.lifetime.benefit-2"](): string;
    /**
      * `{{capacity}} Cloud Storage`
      */
    ["com.yunke.payment.lifetime.benefit-3"](options: {
        readonly capacity: string;
    }): string;
    /**
      * `Dedicated Discord support with YUNKE makers`
      */
    ["com.yunke.payment.lifetime.benefit-4"](): string;
    /**
      * `Become a Life-time supporter?`
      */
    ["com.yunke.payment.lifetime.caption-1"](): string;
    /**
      * `Purchase`
      */
    ["com.yunke.payment.lifetime.purchase"](): string;
    /**
      * `Purchased`
      */
    ["com.yunke.payment.lifetime.purchased"](): string;
    /**
      * `Believer Plan`
      */
    ["com.yunke.payment.lifetime.title"](): string;
    /**
      * `Upgrade`
      */
    ["com.yunke.payment.member-limit.free.confirm"](): string;
    /**
      * `Workspaces created by {{planName}} users are limited to {{quota}} members. To add more collaborators, you can:`
      */
    ["com.yunke.payment.member-limit.description"](options: Readonly<{
        planName: string;
        quota: string;
    }>): string;
    /**
      * `Upgrade to YUNKE Pro for expanded member capacity`
      */
    ["com.yunke.payment.member-limit.description.tips-for-free-plan"](): string;
    /**
      * `Convert to a Team Workspace for unlimited collaboration`
      */
    ["com.yunke.payment.member-limit.description.tips-1"](): string;
    /**
      * `Or create a new workspace`
      */
    ["com.yunke.payment.member-limit.description.tips-2"](): string;
    /**
      * `Got it`
      */
    ["com.yunke.payment.member-limit.pro.confirm"](): string;
    /**
      * `You have reached the limit`
      */
    ["com.yunke.payment.member-limit.title"](): string;
    /**
      * `Manage members here. {{planName}} users can invite up to {{memberLimit}}`
      */
    ["com.yunke.payment.member.description"](options: Readonly<{
        planName: string;
        memberLimit: string;
    }>): string;
    /**
      * `Choose your plan`
      */
    ["com.yunke.payment.member.description.choose-plan"](): string;
    /**
      * `go upgrade`
      */
    ["com.yunke.payment.member.description.go-upgrade"](): string;
    /**
      * `Looking to collaborate with more people?`
      */
    ["com.yunke.payment.member.description2"](): string;
    /**
      * `Work together with unlimited team members.`
      */
    ["com.yunke.payment.member.team.description"](): string;
    /**
      * `Invite team members`
      */
    ["com.yunke.payment.member.team.invite.title"](): string;
    /**
      * `Invite new members to join your workspace via email or share an invite link`
      */
    ["com.yunke.payment.member.team.invite.description"](): string;
    /**
      * `Email Invite`
      */
    ["com.yunke.payment.member.team.invite.email-invite"](): string;
    /**
      * `Invite Link`
      */
    ["com.yunke.payment.member.team.invite.invite-link"](): string;
    /**
      * `Email addresses`
      */
    ["com.yunke.payment.member.team.invite.email-addresses"](): string;
    /**
      * `Enter email addresses (separated by commas)`
      */
    ["com.yunke.payment.member.team.invite.email-placeholder"](): string;
    /**
      * `Import CSV`
      */
    ["com.yunke.payment.member.team.invite.import-csv"](): string;
    /**
      * `Send Invites`
      */
    ["com.yunke.payment.member.team.invite.send-invites"](): string;
    /**
      * `Link expiration`
      */
    ["com.yunke.payment.member.team.invite.link-expiration"](): string;
    /**
      * `{{number}} days`
      */
    ["com.yunke.payment.member.team.invite.expiration-date"](options: {
        readonly number: string;
    }): string;
    /**
      * `To expire at: {{expireTime}}`
      */
    ["com.yunke.payment.member.team.invite.expire-at"](options: {
        readonly expireTime: string;
    }): string;
    /**
      * `Invitation link`
      */
    ["com.yunke.payment.member.team.invite.invitation-link"](): string;
    /**
      * `Generate a link to invite members to your workspace`
      */
    ["com.yunke.payment.member.team.invite.invitation-link.description"](): string;
    /**
      * `Generate`
      */
    ["com.yunke.payment.member.team.invite.generate"](): string;
    /**
      * `Copy`
      */
    ["com.yunke.payment.member.team.invite.copy"](): string;
    /**
      * `Done`
      */
    ["com.yunke.payment.member.team.invite.done"](): string;
    /**
      * `Invitation sent,{{successCount}} successful, {{failedCount}} failed`
      */
    ["com.yunke.payment.member.team.invite.notify.title"](options: Readonly<{
        successCount: string;
        failedCount: string;
    }>): string;
    /**
      * `These email addresses have already been invited:`
      */
    ["com.yunke.payment.member.team.invite.notify.fail-message"](): string;
    /**
      * `Revoke invitation`
      */
    ["com.yunke.payment.member.team.revoke"](): string;
    /**
      * `Approve`
      */
    ["com.yunke.payment.member.team.approve"](): string;
    /**
      * `Decline`
      */
    ["com.yunke.payment.member.team.decline"](): string;
    /**
      * `Remove member`
      */
    ["com.yunke.payment.member.team.remove"](): string;
    /**
      * `Retry payment`
      */
    ["com.yunke.payment.member.team.retry-payment"](): string;
    /**
      * `Change role to admin`
      */
    ["com.yunke.payment.member.team.change.admin"](): string;
    /**
      * `Change role to collaborator`
      */
    ["com.yunke.payment.member.team.change.collaborator"](): string;
    /**
      * `Assign as owner`
      */
    ["com.yunke.payment.member.team.assign"](): string;
    /**
      * `Insufficient Team Seats`
      */
    ["com.yunke.payment.member.team.retry-payment.title"](): string;
    /**
      * `The payment for adding new team members has failed. To add more seats, please update your payment method and process unpaid invoices.`
      */
    ["com.yunke.payment.member.team.retry-payment.owner.description"](): string;
    /**
      * `The payment for adding new team members has failed. Please contact your workspace owner to update the payment method and process unpaid invoices.`
      */
    ["com.yunke.payment.member.team.retry-payment.admin.description"](): string;
    /**
      * `Update Payment`
      */
    ["com.yunke.payment.member.team.retry-payment.update-payment"](): string;
    /**
      * `Subscription has been disabled for your team workspace. To add more seats, you'll need to resume subscription first.`
      */
    ["com.yunke.payment.member.team.disabled-subscription.owner.description"](): string;
    /**
      * `Your team workspace has subscription disabled, which prevents adding more seats. Please contact your workspace owner to enable subscription.`
      */
    ["com.yunke.payment.member.team.disabled-subscription.admin.description"](): string;
    /**
      * `Resume Subscription`
      */
    ["com.yunke.payment.member.team.disabled-subscription.resume-subscription"](): string;
    /**
      * `Invitation Revoked`
      */
    ["com.yunke.payment.member.team.revoke.notify.title"](): string;
    /**
      * `You have canceled the invitation for {{name}}`
      */
    ["com.yunke.payment.member.team.revoke.notify.message"](options: {
        readonly name: string;
    }): string;
    /**
      * `Request approved`
      */
    ["com.yunke.payment.member.team.approve.notify.title"](): string;
    /**
      * `You have approved the {{name}}’s request to join this workspace`
      */
    ["com.yunke.payment.member.team.approve.notify.message"](options: {
        readonly name: string;
    }): string;
    /**
      * `Request declined`
      */
    ["com.yunke.payment.member.team.decline.notify.title"](): string;
    /**
      * `You have declined the {{name}}’s request to join this workspace`
      */
    ["com.yunke.payment.member.team.decline.notify.message"](options: {
        readonly name: string;
    }): string;
    /**
      * `Member removed`
      */
    ["com.yunke.payment.member.team.remove.notify.title"](): string;
    /**
      * `You have removed {{name}} from this workspace`
      */
    ["com.yunke.payment.member.team.remove.notify.message"](options: {
        readonly name: string;
    }): string;
    /**
      * `Role Updated`
      */
    ["com.yunke.payment.member.team.change.notify.title"](): string;
    /**
      * `You have successfully promoted {{name}} to Admin.`
      */
    ["com.yunke.payment.member.team.change.admin.notify.message"](options: {
        readonly name: string;
    }): string;
    /**
      * `You have successfully changed {{name}} s role to collaborator.`
      */
    ["com.yunke.payment.member.team.change.collaborator.notify.message"](options: {
        readonly name: string;
    }): string;
    /**
      * `Owner assigned`
      */
    ["com.yunke.payment.member.team.assign.notify.title"](): string;
    /**
      * `You have successfully assigned {{name}} as the owner of this workspace.`
      */
    ["com.yunke.payment.member.team.assign.notify.message"](options: {
        readonly name: string;
    }): string;
    /**
      * `Confirm new workspace owner`
      */
    ["com.yunke.payment.member.team.assign.confirm.title"](): string;
    /**
      * `You are about to transfer workspace ownership to {{name}}. Please review the following changes carefully:`
      */
    ["com.yunke.payment.member.team.assign.confirm.description"](options: {
        readonly name: string;
    }): string;
    /**
      * `This action cannot be undone`
      */
    ["com.yunke.payment.member.team.assign.confirm.description-1"](): string;
    /**
      * `Your role will be changed to Admin`
      */
    ["com.yunke.payment.member.team.assign.confirm.description-2"](): string;
    /**
      * `You will lose ownership rights to the entire workspace`
      */
    ["com.yunke.payment.member.team.assign.confirm.description-3"](): string;
    /**
      * `To confirm this transfer, please type the workspace name`
      */
    ["com.yunke.payment.member.team.assign.confirm.description-4"](): string;
    /**
      * `Type workspace name to confirm`
      */
    ["com.yunke.payment.member.team.assign.confirm.placeholder"](): string;
    /**
      * `Transfer Ownership`
      */
    ["com.yunke.payment.member.team.assign.confirm.button"](): string;
    /**
      * `Remove member from workspace?`
      */
    ["com.yunke.payment.member.team.remove.confirm.title"](): string;
    /**
      * `This action will revoke their access to all workspace resources immediately.`
      */
    ["com.yunke.payment.member.team.remove.confirm.description"](): string;
    /**
      * `Remove Member`
      */
    ["com.yunke.payment.member.team.remove.confirm.confirm-button"](): string;
    /**
      * `Cancel`
      */
    ["com.yunke.payment.member.team.remove.confirm.cancel"](): string;
    /**
      * `Cancel`
      */
    ["com.yunke.payment.modal.change.cancel"](): string;
    /**
      * `Change`
      */
    ["com.yunke.payment.modal.change.confirm"](): string;
    /**
      * `Change your subscription`
      */
    ["com.yunke.payment.modal.change.title"](): string;
    /**
      * `Cancel subscription`
      */
    ["com.yunke.payment.modal.downgrade.cancel"](): string;
    /**
      * `You can still use YUNKE Cloud Pro until the end of this billing period :)`
      */
    ["com.yunke.payment.modal.downgrade.caption"](): string;
    /**
      * `Keep YUNKE Cloud Pro`
      */
    ["com.yunke.payment.modal.downgrade.confirm"](): string;
    /**
      * `Keep Team plan`
      */
    ["com.yunke.payment.modal.downgrade.team-confirm"](): string;
    /**
      * `We're sorry to see you go, but we're always working to improve, and your feedback is welcome. We hope to see you return in the future.`
      */
    ["com.yunke.payment.modal.downgrade.content"](): string;
    /**
      * `Are you sure?`
      */
    ["com.yunke.payment.modal.downgrade.title"](): string;
    /**
      * `Cancel`
      */
    ["com.yunke.payment.modal.resume.cancel"](): string;
    /**
      * `Confirm`
      */
    ["com.yunke.payment.modal.resume.confirm"](): string;
    /**
      * `Are you sure you want to resume the subscription for your pro account? This means your payment method will be charged automatically at the end of each billing cycle, starting from the next billing cycle.`
      */
    ["com.yunke.payment.modal.resume.content"](): string;
    /**
      * `Resume auto-renewal?`
      */
    ["com.yunke.payment.modal.resume.title"](): string;
    /**
      * `Refresh`
      */
    ["com.yunke.payment.plans-error-retry"](): string;
    /**
      * `Unable to load pricing plans, please check your network. `
      */
    ["com.yunke.payment.plans-error-tip"](): string;
    /**
      * `monthly`
      */
    ["com.yunke.payment.recurring-monthly"](): string;
    /**
      * `annually`
      */
    ["com.yunke.payment.recurring-yearly"](): string;
    /**
      * `Resume`
      */
    ["com.yunke.payment.resume"](): string;
    /**
      * `Subscription Resumed`
      */
    ["com.yunke.payment.resume.success.title"](): string;
    /**
      * `Your team workspace subscription has been enabled successfully. Changes will take effect immediately.`
      */
    ["com.yunke.payment.resume.success.team.message"](): string;
    /**
      * `Resume auto-renewal`
      */
    ["com.yunke.payment.resume-renewal"](): string;
    /**
      * `See all plans`
      */
    ["com.yunke.payment.see-all-plans"](): string;
    /**
      * `Sign up free`
      */
    ["com.yunke.payment.sign-up-free"](): string;
    /**
      * `Cloud storage is insufficient. Please contact the owner of that workspace.`
      */
    ["com.yunke.payment.storage-limit.description.member"](): string;
    /**
      * `Cloud storage is insufficient. You can upgrade your account to unlock more cloud storage.`
      */
    ["com.yunke.payment.storage-limit.description.owner"](): string;
    /**
      * `Unable to sync due to insufficient storage space. You can remove excess content, upgrade your account, or increase your workspace storage to resolve this issue.`
      */
    ["com.yunke.payment.storage-limit.new-description.owner"](): string;
    /**
      * `Sync failed due to storage space limit`
      */
    ["com.yunke.payment.storage-limit.new-title"](): string;
    /**
      * `View`
      */
    ["com.yunke.payment.storage-limit.view"](): string;
    /**
      * `You are currently on the {{plan}} plan. After the current billing period ends, your account will automatically switch to the Free plan.`
      */
    ["com.yunke.payment.subtitle-canceled"](options: {
        readonly plan: string;
    }): string;
    /**
      * `This is the pricing plans of YUNKE Cloud. You can sign up or sign in to your account first.`
      */
    ["com.yunke.payment.subtitle-not-signed-in"](): string;
    /**
      * `See all plans`
      */
    ["com.yunke.payment.tag-tooltips"](): string;
    /**
      * `Tell us your use case`
      */
    ["com.yunke.payment.tell-us-use-case"](): string;
    /**
      * `Pricing plans`
      */
    ["com.yunke.payment.title"](): string;
    /**
      * `You have changed your plan to {{plan}} billing.`
      */
    ["com.yunke.payment.updated-notify-msg"](options: {
        readonly plan: string;
    }): string;
    /**
      * `Subscription updated`
      */
    ["com.yunke.payment.updated-notify-title"](): string;
    /**
      * `Upgrade`
      */
    ["com.yunke.payment.upgrade"](): string;
    /**
      * `Redeem code`
      */
    ["com.yunke.payment.redeem-code"](): string;
    /**
      * `We'd like to hear more about your use case, so that we can make YUNKE better.`
      */
    ["com.yunke.payment.upgrade-success-notify.content"](): string;
    /**
      * `Later`
      */
    ["com.yunke.payment.upgrade-success-notify.later"](): string;
    /**
      * `Sure, open in browser`
      */
    ["com.yunke.payment.upgrade-success-notify.ok-client"](): string;
    /**
      * `Sure, open in new tab`
      */
    ["com.yunke.payment.upgrade-success-notify.ok-web"](): string;
    /**
      * `Thanks for subscribing!`
      */
    ["com.yunke.payment.upgrade-success-notify.title"](): string;
    /**
      * `Congratulations! Your YUNKE account has been successfully upgraded to a Pro account.`
      */
    ["com.yunke.payment.upgrade-success-page.text"](): string;
    /**
      * `Upgrade successful!`
      */
    ["com.yunke.payment.upgrade-success-page.title"](): string;
    /**
      * `Congratulations! Your workspace has been successfully upgraded to a Team Workspace. Now you can invite unlimited members to collaborate in this workspace.`
      */
    ["com.yunke.payment.upgrade-success-page.team.text-1"](): string;
    /**
      * `Thank you for your purchase!`
      */
    ["com.yunke.payment.license-success.title"](): string;
    /**
      * `Thank you for purchasing the YUNKE self-hosted license.`
      */
    ["com.yunke.payment.license-success.text-1"](): string;
    /**
      * `You can use this key to upgrade in Settings > Workspace > License > Use purchased key`
      */
    ["com.yunke.payment.license-success.hint"](): string;
    /**
      * `Open YUNKE`
      */
    ["com.yunke.payment.license-success.open-yunke"](): string;
    /**
      * `Copied key to clipboard`
      */
    ["com.yunke.payment.license-success.copy"](): string;
    /**
      * `Close`
      */
    ["com.yunke.peek-view-controls.close"](): string;
    /**
      * `Open this doc`
      */
    ["com.yunke.peek-view-controls.open-doc"](): string;
    /**
      * `Open in edgeless`
      */
    ["com.yunke.peek-view-controls.open-doc-in-edgeless"](): string;
    /**
      * `Open in new tab`
      */
    ["com.yunke.peek-view-controls.open-doc-in-new-tab"](): string;
    /**
      * `Open in split view`
      */
    ["com.yunke.peek-view-controls.open-doc-in-split-view"](): string;
    /**
      * `Open doc info`
      */
    ["com.yunke.peek-view-controls.open-info"](): string;
    /**
      * `Open this attachment`
      */
    ["com.yunke.peek-view-controls.open-attachment"](): string;
    /**
      * `Open in new tab`
      */
    ["com.yunke.peek-view-controls.open-attachment-in-new-tab"](): string;
    /**
      * `Open in split view`
      */
    ["com.yunke.peek-view-controls.open-attachment-in-split-view"](): string;
    /**
      * `Open in center peek`
      */
    ["com.yunke.peek-view-controls.open-doc-in-center-peek"](): string;
    /**
      * `Copy link`
      */
    ["com.yunke.peek-view-controls.copy-link"](): string;
    /**
      * `Click or drag`
      */
    ["com.yunke.split-view-drag-handle.tooltip"](): string;
    /**
      * `Split view does not support folders.`
      */
    ["com.yunke.split-view-folder-warning.description"](): string;
    /**
      * `Do not show this again`
      */
    ["do-not-show-this-again"](): string;
    /**
      * `New`
      */
    ["com.yunke.quicksearch.group.creation"](): string;
    /**
      * `Search for "{{query}}"`
      */
    ["com.yunke.quicksearch.group.searchfor"](options: {
        readonly query: string;
    }): string;
    /**
      * `Reset sync`
      */
    ["com.yunke.resetSyncStatus.button"](): string;
    /**
      * `This operation may fix some synchronization issues.`
      */
    ["com.yunke.resetSyncStatus.description"](): string;
    /**
      * `Collections`
      */
    ["com.yunke.rootAppSidebar.collections"](): string;
    /**
      * `Notifications`
      */
    ["com.yunke.rootAppSidebar.notifications"](): string;
    /**
      * `Only doc can be placed on here`
      */
    ["com.yunke.rootAppSidebar.doc.link-doc-only"](): string;
    /**
      * `No linked docs`
      */
    ["com.yunke.rootAppSidebar.docs.no-subdoc"](): string;
    /**
      * `Loading linked docs...`
      */
    ["com.yunke.rootAppSidebar.docs.references-loading"](): string;
    /**
      * `New doc`
      */
    ["com.yunke.rootAppSidebar.explorer.collection-add-tooltip"](): string;
    /**
      * `New collection`
      */
    ["com.yunke.rootAppSidebar.explorer.collection-section-add-tooltip"](): string;
    /**
      * `New linked doc`
      */
    ["com.yunke.rootAppSidebar.explorer.doc-add-tooltip"](): string;
    /**
      * `Copy`
      */
    ["com.yunke.rootAppSidebar.explorer.drop-effect.copy"](): string;
    /**
      * `Link`
      */
    ["com.yunke.rootAppSidebar.explorer.drop-effect.link"](): string;
    /**
      * `Move`
      */
    ["com.yunke.rootAppSidebar.explorer.drop-effect.move"](): string;
    /**
      * `New doc`
      */
    ["com.yunke.rootAppSidebar.explorer.fav-section-add-tooltip"](): string;
    /**
      * `New doc`
      */
    ["com.yunke.rootAppSidebar.explorer.organize-add-tooltip"](): string;
    /**
      * `New folder`
      */
    ["com.yunke.rootAppSidebar.explorer.organize-section-add-tooltip"](): string;
    /**
      * `New doc`
      */
    ["com.yunke.rootAppSidebar.explorer.tag-add-tooltip"](): string;
    /**
      * `New tag`
      */
    ["com.yunke.rootAppSidebar.explorer.tag-section-add-tooltip"](): string;
    /**
      * `Favorites`
      */
    ["com.yunke.rootAppSidebar.favorites"](): string;
    /**
      * `No favorites`
      */
    ["com.yunke.rootAppSidebar.favorites.empty"](): string;
    /**
      * `Migration data`
      */
    ["com.yunke.rootAppSidebar.migration-data"](): string;
    /**
      * `Empty the old favorites`
      */
    ["com.yunke.rootAppSidebar.migration-data.clean-all"](): string;
    /**
      * `Cancel`
      */
    ["com.yunke.rootAppSidebar.migration-data.clean-all.cancel"](): string;
    /**
      * `OK`
      */
    ["com.yunke.rootAppSidebar.migration-data.clean-all.confirm"](): string;
    /**
      * `The old "Favorites" will be replaced`
      */
    ["com.yunke.rootAppSidebar.migration-data.help"](): string;
    /**
      * `Empty the old favorites`
      */
    ["com.yunke.rootAppSidebar.migration-data.help.clean-all"](): string;
    /**
      * `OK`
      */
    ["com.yunke.rootAppSidebar.migration-data.help.confirm"](): string;
    /**
      * `Organize`
      */
    ["com.yunke.rootAppSidebar.organize"](): string;
    /**
      * `Delete`
      */
    ["com.yunke.rootAppSidebar.organize.delete"](): string;
    /**
      * `Remove from folder`
      */
    ["com.yunke.rootAppSidebar.organize.delete-from-folder"](): string;
    /**
      * `Delete the folder will not delete any docs, tags, or collections.`
      */
    ["com.yunke.rootAppSidebar.organize.delete.notify-message"](): string;
    /**
      * `Delete {{name}}`
      */
    ["com.yunke.rootAppSidebar.organize.delete.notify-title"](options: {
        readonly name: string;
    }): string;
    /**
      * `No folders`
      */
    ["com.yunke.rootAppSidebar.organize.empty"](): string;
    /**
      * `Empty folder`
      */
    ["com.yunke.rootAppSidebar.organize.empty-folder"](): string;
    /**
      * `Add pages`
      */
    ["com.yunke.rootAppSidebar.organize.empty-folder.add-pages"](): string;
    /**
      * `New folder`
      */
    ["com.yunke.rootAppSidebar.organize.empty.new-folders-button"](): string;
    /**
      * `Add to favorites`
      */
    ["com.yunke.rootAppSidebar.organize.folder-add-favorite"](): string;
    /**
      * `Remove from favorites`
      */
    ["com.yunke.rootAppSidebar.organize.folder-rm-favorite"](): string;
    /**
      * `Add Collections`
      */
    ["com.yunke.rootAppSidebar.organize.folder.add-collections"](): string;
    /**
      * `New doc`
      */
    ["com.yunke.rootAppSidebar.organize.folder.new-doc"](): string;
    /**
      * `Add docs`
      */
    ["com.yunke.rootAppSidebar.organize.folder.add-docs"](): string;
    /**
      * `Add others`
      */
    ["com.yunke.rootAppSidebar.organize.folder.add-others"](): string;
    /**
      * `Add tags`
      */
    ["com.yunke.rootAppSidebar.organize.folder.add-tags"](): string;
    /**
      * `Create a subfolder`
      */
    ["com.yunke.rootAppSidebar.organize.folder.create-subfolder"](): string;
    /**
      * `New folder`
      */
    ["com.yunke.rootAppSidebar.organize.new-folders"](): string;
    /**
      * `Only folder can be placed on here`
      */
    ["com.yunke.rootAppSidebar.organize.root-folder-only"](): string;
    /**
      * `Add More`
      */
    ["com.yunke.rootAppSidebar.organize.add-more"](): string;
    /**
      * `Add Folder`
      */
    ["com.yunke.rootAppSidebar.organize.add-folder"](): string;
    /**
      * `New Collection`
      */
    ["com.yunke.rootAppSidebar.collection.new"](): string;
    /**
      * `Others`
      */
    ["com.yunke.rootAppSidebar.others"](): string;
    /**
      * `Only doc can be placed on here`
      */
    ["com.yunke.rootAppSidebar.tag.doc-only"](): string;
    /**
      * `Tags`
      */
    ["com.yunke.rootAppSidebar.tags"](): string;
    /**
      * `No tags`
      */
    ["com.yunke.rootAppSidebar.tags.empty"](): string;
    /**
      * `New tag`
      */
    ["com.yunke.rootAppSidebar.tags.empty.new-tag-button"](): string;
    /**
      * `New tag`
      */
    ["com.yunke.rootAppSidebar.tags.new-tag"](): string;
    /**
      * `No docs`
      */
    ["com.yunke.rootAppSidebar.tags.no-doc"](): string;
    /**
      * `Drag to resize`
      */
    ["com.yunke.rootAppSidebar.resize-handle.tooltip.drag"](): string;
    /**
      * `Click to collapse`
      */
    ["com.yunke.rootAppSidebar.resize-handle.tooltip.click"](): string;
    /**
      * `Type here ...`
      */
    ["com.yunke.search-tags.placeholder"](): string;
    /**
      * `Empty`
      */
    ["com.yunke.selectPage.empty"](): string;
    /**
      * `Selected`
      */
    ["com.yunke.selectPage.selected"](): string;
    /**
      * `Add include doc`
      */
    ["com.yunke.selectPage.title"](): string;
    /**
      * `Search collections...`
      */
    ["com.yunke.selector-collection.search.placeholder"](): string;
    /**
      * `Search tags...`
      */
    ["com.yunke.selector-tag.search.placeholder"](): string;
    /**
      * `Notifications`
      */
    ["com.yunke.setting.notifications"](): string;
    /**
      * `Notifications`
      */
    ["com.yunke.setting.notifications.header.title"](): string;
    /**
      * `Choose the types of updates you want to receive and where to get them.`
      */
    ["com.yunke.setting.notifications.header.description"](): string;
    /**
      * `Email notifications`
      */
    ["com.yunke.setting.notifications.email.title"](): string;
    /**
      * `Mention`
      */
    ["com.yunke.setting.notifications.email.mention.title"](): string;
    /**
      * `You will be notified through email when other members of the workspace @ you.`
      */
    ["com.yunke.setting.notifications.email.mention.subtitle"](): string;
    /**
      * `Invites`
      */
    ["com.yunke.setting.notifications.email.invites.title"](): string;
    /**
      * `Invitation related messages will be sent through emails.`
      */
    ["com.yunke.setting.notifications.email.invites.subtitle"](): string;
    /**
      * `Account settings`
      */
    ["com.yunke.setting.account"](): string;
    /**
      * `Delete your account`
      */
    ["com.yunke.setting.account.delete"](): string;
    /**
      * `Once deleted, your account will no longer be accessible, and all data in your personal cloud space will be permanently deleted.`
      */
    ["com.yunke.setting.account.delete.message"](): string;
    /**
      * `Cannot delete account`
      */
    ["com.yunke.setting.account.delete.team-warning-title"](): string;
    /**
      * `You’re the owner of a team workspace. To delete your account, please delete the workspace or transfer ownership first.`
      */
    ["com.yunke.setting.account.delete.team-warning-description"](): string;
    /**
      * `Delete your account?`
      */
    ["com.yunke.setting.account.delete.confirm-title"](): string;
    /**
      * `Are you sure you want to delete your account?`
      */
    ["com.yunke.setting.account.delete.confirm-description-1"](): string;
    /**
      * `Please type your email to confirm`
      */
    ["com.yunke.setting.account.delete.input-placeholder"](): string;
    /**
      * `Delete`
      */
    ["com.yunke.setting.account.delete.confirm-button"](): string;
    /**
      * `Account deleted`
      */
    ["com.yunke.setting.account.delete.success-title"](): string;
    /**
      * `Your account and cloud data have been deleted.`
      */
    ["com.yunke.setting.account.delete.success-description-1"](): string;
    /**
      * `Local data can be deleted by uninstalling app and clearing browser data.`
      */
    ["com.yunke.setting.account.delete.success-description-2"](): string;
    /**
      * `Your personal information`
      */
    ["com.yunke.setting.account.message"](): string;
    /**
      * `Sync with YUNKE Cloud`
      */
    ["com.yunke.setting.sign.message"](): string;
    /**
      * `Securely sign out of your account.`
      */
    ["com.yunke.setting.sign.out.message"](): string;
    /**
      * `General`
      */
    ["com.yunke.settingSidebar.settings.general"](): string;
    /**
      * `Workspace`
      */
    ["com.yunke.settingSidebar.settings.workspace"](): string;
    /**
      * `Settings`
      */
    ["com.yunke.settingSidebar.title"](): string;
    /**
      * `Appearance`
      */
    ["com.yunke.settings.appearance"](): string;
    /**
      * `Customise the appearance of the client.`
      */
    ["com.yunke.settings.appearance.border-style-description"](): string;
    /**
      * `Customise your date style.`
      */
    ["com.yunke.settings.appearance.date-format-description"](): string;
    /**
      * `Maximum display of content within a doc.`
      */
    ["com.yunke.settings.appearance.full-width-description"](): string;
    /**
      * `Select the language for the interface.`
      */
    ["com.yunke.settings.appearance.language-description"](): string;
    /**
      * `By default, the week starts on Sunday.`
      */
    ["com.yunke.settings.appearance.start-week-description"](): string;
    /**
      * `Customise appearance of Windows Client.`
      */
    ["com.yunke.settings.appearance.window-frame-description"](): string;
    /**
      * `Links`
      */
    ["com.yunke.setting.appearance.links"](): string;
    /**
      * `Open YUNKE links`
      */
    ["com.yunke.setting.appearance.open-in-app"](): string;
    /**
      * `You can choose to open the link in the desktop app or directly in the browser.`
      */
    ["com.yunke.setting.appearance.open-in-app.hint"](): string;
    /**
      * `Ask me each time`
      */
    ["com.yunke.setting.appearance.open-in-app.always-ask"](): string;
    /**
      * `Open links in desktop app`
      */
    ["com.yunke.setting.appearance.open-in-app.open-in-desktop-app"](): string;
    /**
      * `Open links in browser`
      */
    ["com.yunke.setting.appearance.open-in-app.open-in-web"](): string;
    /**
      * `Open YUNKE links`
      */
    ["com.yunke.setting.appearance.open-in-app.title"](): string;
    /**
      * `Open this doc in YUNKE app`
      */
    ["com.yunke.open-in-app.card.title"](): string;
    /**
      * `Open in app`
      */
    ["com.yunke.open-in-app.card.button.open"](): string;
    /**
      * `Dismiss`
      */
    ["com.yunke.open-in-app.card.button.dismiss"](): string;
    /**
      * `Remember choice`
      */
    ["com.yunke.open-in-app.card.remember"](): string;
    /**
      * `Download desktop app`
      */
    ["com.yunke.open-in-app.card.download"](): string;
    /**
      * `If enabled, it will automatically check for new versions at regular intervals.`
      */
    ["com.yunke.settings.auto-check-description"](): string;
    /**
      * `If enabled, new versions will be automatically downloaded to the current device.`
      */
    ["com.yunke.settings.auto-download-description"](): string;
    /**
      * `Editor`
      */
    ["com.yunke.settings.editorSettings"](): string;
    /**
      * `Edgeless`
      */
    ["com.yunke.settings.editorSettings.edgeless"](): string;
    /**
      * `Connector`
      */
    ["com.yunke.settings.editorSettings.edgeless.connecter"](): string;
    /**
      * `Border style`
      */
    ["com.yunke.settings.editorSettings.edgeless.connecter.border-style"](): string;
    /**
      * `Border thickness`
      */
    ["com.yunke.settings.editorSettings.edgeless.connecter.border-thickness"](): string;
    /**
      * `Color`
      */
    ["com.yunke.settings.editorSettings.edgeless.connecter.color"](): string;
    /**
      * `Connector shape`
      */
    ["com.yunke.settings.editorSettings.edgeless.connecter.connector-shape"](): string;
    /**
      * `Curve`
      */
    ["com.yunke.settings.editorSettings.edgeless.connecter.connector-shape.curve"](): string;
    /**
      * `Elbowed`
      */
    ["com.yunke.settings.editorSettings.edgeless.connecter.connector-shape.elbowed"](): string;
    /**
      * `Straight`
      */
    ["com.yunke.settings.editorSettings.edgeless.connecter.connector-shape.straight"](): string;
    /**
      * `End endpoint`
      */
    ["com.yunke.settings.editorSettings.edgeless.connecter.end-endpoint"](): string;
    /**
      * `Start endpoint`
      */
    ["com.yunke.settings.editorSettings.edgeless.connecter.start-endpoint"](): string;
    /**
      * `Custom`
      */
    ["com.yunke.settings.editorSettings.edgeless.custom"](): string;
    /**
      * `Mind Map`
      */
    ["com.yunke.settings.editorSettings.edgeless.mind-map"](): string;
    /**
      * `Layout`
      */
    ["com.yunke.settings.editorSettings.edgeless.mind-map.layout"](): string;
    /**
      * `Left`
      */
    ["com.yunke.settings.editorSettings.edgeless.mind-map.layout.left"](): string;
    /**
      * `Radial`
      */
    ["com.yunke.settings.editorSettings.edgeless.mind-map.layout.radial"](): string;
    /**
      * `Right`
      */
    ["com.yunke.settings.editorSettings.edgeless.mind-map.layout.right"](): string;
    /**
      * `Note`
      */
    ["com.yunke.settings.editorSettings.edgeless.note"](): string;
    /**
      * `Background`
      */
    ["com.yunke.settings.editorSettings.edgeless.note.background"](): string;
    /**
      * `Border style`
      */
    ["com.yunke.settings.editorSettings.edgeless.note.border"](): string;
    /**
      * `Border thickness`
      */
    ["com.yunke.settings.editorSettings.edgeless.note.border-thickness"](): string;
    /**
      * `Dash`
      */
    ["com.yunke.settings.editorSettings.edgeless.note.border.dash"](): string;
    /**
      * `None`
      */
    ["com.yunke.settings.editorSettings.edgeless.note.border.none"](): string;
    /**
      * `Solid`
      */
    ["com.yunke.settings.editorSettings.edgeless.note.border.solid"](): string;
    /**
      * `Corners`
      */
    ["com.yunke.settings.editorSettings.edgeless.note.corners"](): string;
    /**
      * `Shadow style`
      */
    ["com.yunke.settings.editorSettings.edgeless.note.shadow"](): string;
    /**
      * `Pen`
      */
    ["com.yunke.settings.editorSettings.edgeless.pen"](): string;
    /**
      * `Color`
      */
    ["com.yunke.settings.editorSettings.edgeless.pen.color"](): string;
    /**
      * `Thickness`
      */
    ["com.yunke.settings.editorSettings.edgeless.pen.thickness"](): string;
    /**
      * `Shape`
      */
    ["com.yunke.settings.editorSettings.edgeless.shape"](): string;
    /**
      * `Border color`
      */
    ["com.yunke.settings.editorSettings.edgeless.shape.border-color"](): string;
    /**
      * `Border style`
      */
    ["com.yunke.settings.editorSettings.edgeless.shape.border-style"](): string;
    /**
      * `Border thickness`
      */
    ["com.yunke.settings.editorSettings.edgeless.shape.border-thickness"](): string;
    /**
      * `Diamond`
      */
    ["com.yunke.settings.editorSettings.edgeless.shape.diamond"](): string;
    /**
      * `Ellipse`
      */
    ["com.yunke.settings.editorSettings.edgeless.shape.ellipse"](): string;
    /**
      * `Fill color`
      */
    ["com.yunke.settings.editorSettings.edgeless.shape.fill-color"](): string;
    /**
      * `Flow`
      */
    ["com.yunke.settings.editorSettings.edgeless.shape.flow"](): string;
    /**
      * `Font`
      */
    ["com.yunke.settings.editorSettings.edgeless.shape.font"](): string;
    /**
      * `Font size`
      */
    ["com.yunke.settings.editorSettings.edgeless.shape.font-size"](): string;
    /**
      * `Font style`
      */
    ["com.yunke.settings.editorSettings.edgeless.shape.font-style"](): string;
    /**
      * `List`
      */
    ["com.yunke.settings.editorSettings.edgeless.shape.list"](): string;
    /**
      * `Rounded Rectangle`
      */
    ["com.yunke.settings.editorSettings.edgeless.shape.rounded-rectangle"](): string;
    /**
      * `Square`
      */
    ["com.yunke.settings.editorSettings.edgeless.shape.square"](): string;
    /**
      * `Text alignment`
      */
    ["com.yunke.settings.editorSettings.edgeless.shape.text-alignment"](): string;
    /**
      * `Text color`
      */
    ["com.yunke.settings.editorSettings.edgeless.shape.text-color"](): string;
    /**
      * `Triangle`
      */
    ["com.yunke.settings.editorSettings.edgeless.shape.triangle"](): string;
    /**
      * `Frame`
      */
    ["com.yunke.settings.editorSettings.edgeless.frame"](): string;
    /**
      * `Background`
      */
    ["com.yunke.settings.editorSettings.edgeless.frame.background"](): string;
    /**
      * `Style`
      */
    ["com.yunke.settings.editorSettings.edgeless.style"](): string;
    /**
      * `General`
      */
    ["com.yunke.settings.editorSettings.edgeless.style.general"](): string;
    /**
      * `Scribbled`
      */
    ["com.yunke.settings.editorSettings.edgeless.style.scribbled"](): string;
    /**
      * `Text`
      */
    ["com.yunke.settings.editorSettings.edgeless.text"](): string;
    /**
      * `Alignment`
      */
    ["com.yunke.settings.editorSettings.edgeless.text.alignment"](): string;
    /**
      * `Center`
      */
    ["com.yunke.settings.editorSettings.edgeless.text.alignment.center"](): string;
    /**
      * `Left`
      */
    ["com.yunke.settings.editorSettings.edgeless.text.alignment.left"](): string;
    /**
      * `Right`
      */
    ["com.yunke.settings.editorSettings.edgeless.text.alignment.right"](): string;
    /**
      * `Text color`
      */
    ["com.yunke.settings.editorSettings.edgeless.text.color"](): string;
    /**
      * `Font`
      */
    ["com.yunke.settings.editorSettings.edgeless.text.font"](): string;
    /**
      * `Font family`
      */
    ["com.yunke.settings.editorSettings.edgeless.text.font-family"](): string;
    /**
      * `Font size`
      */
    ["com.yunke.settings.editorSettings.edgeless.text.font-size"](): string;
    /**
      * `Font style`
      */
    ["com.yunke.settings.editorSettings.edgeless.text.font-style"](): string;
    /**
      * `Font weight`
      */
    ["com.yunke.settings.editorSettings.edgeless.text.font-weight"](): string;
    /**
      * `General`
      */
    ["com.yunke.settings.editorSettings.general"](): string;
    /**
      * `Enable the powerful AI assistant, YUNKE AI.`
      */
    ["com.yunke.settings.editorSettings.general.ai.description"](): string;
    /**
      * `Disable AI and Reload`
      */
    ["com.yunke.settings.editorSettings.general.ai.disable.confirm"](): string;
    /**
      * `Are you sure you want to disable AI? We value your productivity and our AI can enhance it. Please think again!`
      */
    ["com.yunke.settings.editorSettings.general.ai.disable.description"](): string;
    /**
      * `Disable AI?`
      */
    ["com.yunke.settings.editorSettings.general.ai.disable.title"](): string;
    /**
      * `Enable AI and Reload`
      */
    ["com.yunke.settings.editorSettings.general.ai.enable.confirm"](): string;
    /**
      * `Do you want to enable AI? Our AI assistant is ready to enhance your productivity and provide smart assistance. Let's get started! We need reload page to make this change.`
      */
    ["com.yunke.settings.editorSettings.general.ai.enable.description"](): string;
    /**
      * `Enable AI?`
      */
    ["com.yunke.settings.editorSettings.general.ai.enable.title"](): string;
    /**
      * `YUNKE AI`
      */
    ["com.yunke.settings.editorSettings.general.ai.title"](): string;
    /**
      * `Set a default programming language.`
      */
    ["com.yunke.settings.editorSettings.general.default-code-block.language.description"](): string;
    /**
      * `Code blocks default language`
      */
    ["com.yunke.settings.editorSettings.general.default-code-block.language.title"](): string;
    /**
      * `Encapsulate code snippets for better readability.`
      */
    ["com.yunke.settings.editorSettings.general.default-code-block.wrap.description"](): string;
    /**
      * `Wrap code in code blocks`
      */
    ["com.yunke.settings.editorSettings.general.default-code-block.wrap.title"](): string;
    /**
      * `Default mode for new doc.`
      */
    ["com.yunke.settings.editorSettings.general.default-new-doc.description"](): string;
    /**
      * `New doc default mode`
      */
    ["com.yunke.settings.editorSettings.general.default-new-doc.title"](): string;
    /**
      * `Customize your text experience.`
      */
    ["com.yunke.settings.editorSettings.general.font-family.custom.description"](): string;
    /**
      * `Custom font family`
      */
    ["com.yunke.settings.editorSettings.general.font-family.custom.title"](): string;
    /**
      * `Choose your editor's font family.`
      */
    ["com.yunke.settings.editorSettings.general.font-family.description"](): string;
    /**
      * `Font family`
      */
    ["com.yunke.settings.editorSettings.general.font-family.title"](): string;
    /**
      * `Automatically detect and correct spelling errors.`
      */
    ["com.yunke.settings.editorSettings.general.spell-check.description"](): string;
    /**
      * `Spell check`
      */
    ["com.yunke.settings.editorSettings.general.spell-check.title"](): string;
    /**
      * `Page`
      */
    ["com.yunke.settings.editorSettings.page"](): string;
    /**
      * `Middle click paste`
      */
    ["com.yunke.settings.editorSettings.general.middle-click-paste.title"](): string;
    /**
      * `Enable default middle click paste behavior on Linux.`
      */
    ["com.yunke.settings.editorSettings.general.middle-click-paste.description"](): string;
    /**
      * `Display bi-directional links on the doc.`
      */
    ["com.yunke.settings.editorSettings.page.display-bi-link.description"](): string;
    /**
      * `Display bi-directional links`
      */
    ["com.yunke.settings.editorSettings.page.display-bi-link.title"](): string;
    /**
      * `Display document information on the doc.`
      */
    ["com.yunke.settings.editorSettings.page.display-doc-info.description"](): string;
    /**
      * `Display doc info`
      */
    ["com.yunke.settings.editorSettings.page.display-doc-info.title"](): string;
    /**
      * `Maximise display of content within a page.`
      */
    ["com.yunke.settings.editorSettings.page.full-width.description"](): string;
    /**
      * `Full width layout`
      */
    ["com.yunke.settings.editorSettings.page.full-width.title"](): string;
    /**
      * `Default page width`
      */
    ["com.yunke.settings.editorSettings.page.default-page-width.title"](): string;
    /**
      * `Set default width for new pages, individual pages can override.`
      */
    ["com.yunke.settings.editorSettings.page.default-page-width.description"](): string;
    /**
      * `Standard`
      */
    ["com.yunke.settings.editorSettings.page.default-page-width.standard"](): string;
    /**
      * `Full width`
      */
    ["com.yunke.settings.editorSettings.page.default-page-width.full-width"](): string;
    /**
      * `Set edgeless default color scheme.`
      */
    ["com.yunke.settings.editorSettings.page.edgeless-default-theme.description"](): string;
    /**
      * `Edgeless default theme`
      */
    ["com.yunke.settings.editorSettings.page.edgeless-default-theme.title"](): string;
    /**
      * `Specified by current color mode`
      */
    ["com.yunke.settings.editorSettings.page.edgeless-default-theme.specified"](): string;
    /**
      * `Scroll wheel zoom`
      */
    ["com.yunke.settings.editorSettings.page.edgeless-scroll-wheel-zoom.title"](): string;
    /**
      * `Use the scroll wheel to zoom in and out.`
      */
    ["com.yunke.settings.editorSettings.page.edgeless-scroll-wheel-zoom.description"](): string;
    /**
      * `Preferences`
      */
    ["com.yunke.settings.editorSettings.preferences"](): string;
    /**
      * `You can export the entire preferences data for backup, and the exported data can be re-imported.`
      */
    ["com.yunke.settings.editorSettings.preferences.export.description"](): string;
    /**
      * `Export Settings`
      */
    ["com.yunke.settings.editorSettings.preferences.export.title"](): string;
    /**
      * `You can import previously exported preferences data for restoration.`
      */
    ["com.yunke.settings.editorSettings.preferences.import.description"](): string;
    /**
      * `Import Settings`
      */
    ["com.yunke.settings.editorSettings.preferences.import.title"](): string;
    /**
      * `Configure your own editor`
      */
    ["com.yunke.settings.editorSettings.subtitle"](): string;
    /**
      * `Editor settings`
      */
    ["com.yunke.settings.editorSettings.title"](): string;
    /**
      * `Ask me every time`
      */
    ["com.yunke.settings.editorSettings.ask-me-every-time"](): string;
    /**
      * `Email`
      */
    ["com.yunke.settings.email"](): string;
    /**
      * `Change email`
      */
    ["com.yunke.settings.email.action"](): string;
    /**
      * `Change email`
      */
    ["com.yunke.settings.email.action.change"](): string;
    /**
      * `Verify email`
      */
    ["com.yunke.settings.email.action.verify"](): string;
    /**
      * `Enable YUNKE Cloud to collaborate with others`
      */
    ["com.yunke.settings.member-tooltip"](): string;
    /**
      * `Loading member list...`
      */
    ["com.yunke.settings.member.loading"](): string;
    /**
      * `Noise background on the sidebar`
      */
    ["com.yunke.settings.noise-style"](): string;
    /**
      * `Use background noise effect on the sidebar.`
      */
    ["com.yunke.settings.noise-style-description"](): string;
    /**
      * `Password`
      */
    ["com.yunke.settings.password"](): string;
    /**
      * `Change password`
      */
    ["com.yunke.settings.password.action.change"](): string;
    /**
      * `Set password`
      */
    ["com.yunke.settings.password.action.set"](): string;
    /**
      * `Set a password to sign in to your account`
      */
    ["com.yunke.settings.password.message"](): string;
    /**
      * `My profile`
      */
    ["com.yunke.settings.profile"](): string;
    /**
      * `Your account profile will be displayed to everyone.`
      */
    ["com.yunke.settings.profile.message"](): string;
    /**
      * `Display name`
      */
    ["com.yunke.settings.profile.name"](): string;
    /**
      * `Input account name`
      */
    ["com.yunke.settings.profile.placeholder"](): string;
    /**
      * `Remove workspace`
      */
    ["com.yunke.settings.remove-workspace"](): string;
    /**
      * `Remove workspace from this device and optionally delete all data.`
      */
    ["com.yunke.settings.remove-workspace-description"](): string;
    /**
      * `Sign in / Sign up`
      */
    ["com.yunke.settings.sign"](): string;
    /**
      * `Need more customization options? Tell us in the community.`
      */
    ["com.yunke.settings.suggestion"](): string;
    /**
      * `Translucent UI on the sidebar`
      */
    ["com.yunke.settings.translucent-style"](): string;
    /**
      * `Use transparency effect on the sidebar.`
      */
    ["com.yunke.settings.translucent-style-description"](): string;
    /**
      * `Meetings`
      */
    ["com.yunke.settings.meetings"](): string;
    /**
      * `Beyond Recording
    Your AI Meeting Assistant is Here`
      */
    ["com.yunke.settings.meetings.setting.welcome"](): string;
    /**
      * `Native Audio Capture, No Bots Required - Direct from Your Mac to Meeting Intelligence.`
      */
    ["com.yunke.settings.meetings.setting.prompt"](): string;
    /**
      * `Learn more`
      */
    ["com.yunke.settings.meetings.setting.welcome.learn-more"](): string;
    /**
      * `Enable meeting notes`
      */
    ["com.yunke.settings.meetings.enable.title"](): string;
    /**
      * `Meeting recording`
      */
    ["com.yunke.settings.meetings.record.header"](): string;
    /**
      * `When meeting starts`
      */
    ["com.yunke.settings.meetings.record.recording-mode"](): string;
    /**
      * `Choose the behavior when the meeting starts.`
      */
    ["com.yunke.settings.meetings.record.recording-mode.description"](): string;
    /**
      * `Open saved recordings`
      */
    ["com.yunke.settings.meetings.record.open-saved-file"](): string;
    /**
      * `Open the locally stored recording files.`
      */
    ["com.yunke.settings.meetings.record.open-saved-file.description"](): string;
    /**
      * `Transcription with AI`
      */
    ["com.yunke.settings.meetings.transcription.header"](): string;
    /**
      * `AI auto summary`
      */
    ["com.yunke.settings.meetings.transcription.auto-summary"](): string;
    /**
      * `Automatically generate a summary of the meeting notes.`
      */
    ["com.yunke.settings.meetings.transcription.auto-summary.description"](): string;
    /**
      * `AI auto todo list`
      */
    ["com.yunke.settings.meetings.transcription.auto-todo"](): string;
    /**
      * `Automatically generate a todo list of the meeting notes.`
      */
    ["com.yunke.settings.meetings.transcription.auto-todo.description"](): string;
    /**
      * `Privacy & Security`
      */
    ["com.yunke.settings.meetings.privacy.header"](): string;
    /**
      * `Screen & System audio recording`
      */
    ["com.yunke.settings.meetings.privacy.screen-system-audio-recording"](): string;
    /**
      * `The Meeting feature requires permission to be used.`
      */
    ["com.yunke.settings.meetings.privacy.screen-system-audio-recording.description"](): string;
    /**
      * `Click to allow`
      */
    ["com.yunke.settings.meetings.privacy.screen-system-audio-recording.permission-setting"](): string;
    /**
      * `Microphone`
      */
    ["com.yunke.settings.meetings.privacy.microphone"](): string;
    /**
      * `The Meeting feature requires permission to be used.`
      */
    ["com.yunke.settings.meetings.privacy.microphone.description"](): string;
    /**
      * `Click to allow`
      */
    ["com.yunke.settings.meetings.privacy.microphone.permission-setting"](): string;
    /**
      * `Permission issues`
      */
    ["com.yunke.settings.meetings.privacy.issues"](): string;
    /**
      * `Permissions are granted but the status isn't updated? Restart the app to refresh permissions.`
      */
    ["com.yunke.settings.meetings.privacy.issues.description"](): string;
    /**
      * `Restart App`
      */
    ["com.yunke.settings.meetings.privacy.issues.restart"](): string;
    /**
      * `Do nothing`
      */
    ["com.yunke.settings.meetings.record.recording-mode.none"](): string;
    /**
      * `Auto start recording`
      */
    ["com.yunke.settings.meetings.record.recording-mode.auto-start"](): string;
    /**
      * `Show a recording prompt`
      */
    ["com.yunke.settings.meetings.record.recording-mode.prompt"](): string;
    /**
      * `Screen & System Audio Recording`
      */
    ["com.yunke.settings.meetings.record.permission-modal.title"](): string;
    /**
      * `YUNKE will generate meeting notes by recording your meetings. Authorization to "Screen & System Audio Recording" is necessary.`
      */
    ["com.yunke.settings.meetings.record.permission-modal.description"](): string;
    /**
      * `Save meeting's recording block to`
      */
    ["com.yunke.settings.meetings.record.save-mode"](): string;
    /**
      * `Open System Settings`
      */
    ["com.yunke.settings.meetings.record.permission-modal.open-setting"](): string;
    /**
      * `Workspace`
      */
    ["com.yunke.settings.workspace"](): string;
    /**
      * `You can view current workspace's information here.`
      */
    ["com.yunke.settings.workspace.description"](): string;
    /**
      * `Experimental features`
      */
    ["com.yunke.settings.workspace.experimental-features"](): string;
    /**
      * `Get started`
      */
    ["com.yunke.settings.workspace.experimental-features.get-started"](): string;
    /**
      * `Experimental features`
      */
    ["com.yunke.settings.workspace.experimental-features.header.plugins"](): string;
    /**
      * `Some features available for early access`
      */
    ["com.yunke.settings.workspace.experimental-features.header.subtitle"](): string;
    /**
      * `I am aware of the risks, and I am willing to continue to use it.`
      */
    ["com.yunke.settings.workspace.experimental-features.prompt-disclaimer"](): string;
    /**
      * `Do you want to use the plugin system that is in an experimental stage?`
      */
    ["com.yunke.settings.workspace.experimental-features.prompt-header"](): string;
    /**
      * `You are about to enable an experimental feature. This feature is still in development and may contain errors or behave unpredictably. Please proceed with caution and at your own risk.`
      */
    ["com.yunke.settings.workspace.experimental-features.prompt-warning"](): string;
    /**
      * `WARNING MESSAGE`
      */
    ["com.yunke.settings.workspace.experimental-features.prompt-warning-title"](): string;
    /**
      * `Enable AI`
      */
    ["com.yunke.settings.workspace.experimental-features.enable-ai.name"](): string;
    /**
      * `Enable or disable ALL AI features.`
      */
    ["com.yunke.settings.workspace.experimental-features.enable-ai.description"](): string;
    /**
      * `Enable AI Network Search`
      */
    ["com.yunke.settings.workspace.experimental-features.enable-ai-network-search.name"](): string;
    /**
      * `Enable or disable AI Network Search feature.`
      */
    ["com.yunke.settings.workspace.experimental-features.enable-ai-network-search.description"](): string;
    /**
      * `Enable AI Model Switch`
      */
    ["com.yunke.settings.workspace.experimental-features.enable-ai-model-switch.name"](): string;
    /**
      * `Enable or disable AI model switch feature.`
      */
    ["com.yunke.settings.workspace.experimental-features.enable-ai-model-switch.description"](): string;
    /**
      * `Database Full Width`
      */
    ["com.yunke.settings.workspace.experimental-features.enable-database-full-width.name"](): string;
    /**
      * `The database will be displayed in full-width mode.`
      */
    ["com.yunke.settings.workspace.experimental-features.enable-database-full-width.description"](): string;
    /**
      * `Database Attachment Note`
      */
    ["com.yunke.settings.workspace.experimental-features.enable-database-attachment-note.name"](): string;
    /**
      * `Allows adding notes to database attachments.`
      */
    ["com.yunke.settings.workspace.experimental-features.enable-database-attachment-note.description"](): string;
    /**
      * `Todo Block Query`
      */
    ["com.yunke.settings.workspace.experimental-features.enable-block-query.name"](): string;
    /**
      * `Enables querying of todo blocks.`
      */
    ["com.yunke.settings.workspace.experimental-features.enable-block-query.description"](): string;
    /**
      * `Synced Doc Block`
      */
    ["com.yunke.settings.workspace.experimental-features.enable-synced-doc-block.name"](): string;
    /**
      * `Enables syncing of doc blocks.`
      */
    ["com.yunke.settings.workspace.experimental-features.enable-synced-doc-block.description"](): string;
    /**
      * `Edgeless Text`
      */
    ["com.yunke.settings.workspace.experimental-features.enable-edgeless-text.name"](): string;
    /**
      * `Enables edgeless text blocks.`
      */
    ["com.yunke.settings.workspace.experimental-features.enable-edgeless-text.description"](): string;
    /**
      * `Color Picker`
      */
    ["com.yunke.settings.workspace.experimental-features.enable-color-picker.name"](): string;
    /**
      * `Enables color picker blocks.`
      */
    ["com.yunke.settings.workspace.experimental-features.enable-color-picker.description"](): string;
    /**
      * `AI Chat Block`
      */
    ["com.yunke.settings.workspace.experimental-features.enable-ai-chat-block.name"](): string;
    /**
      * `Enables AI chat blocks.`
      */
    ["com.yunke.settings.workspace.experimental-features.enable-ai-chat-block.description"](): string;
    /**
      * `AI Onboarding`
      */
    ["com.yunke.settings.workspace.experimental-features.enable-ai-onboarding.name"](): string;
    /**
      * `Enables AI onboarding.`
      */
    ["com.yunke.settings.workspace.experimental-features.enable-ai-onboarding.description"](): string;
    /**
      * `Mind Map Import`
      */
    ["com.yunke.settings.workspace.experimental-features.enable-mind-map-import.name"](): string;
    /**
      * `Enables mind map import.`
      */
    ["com.yunke.settings.workspace.experimental-features.enable-mind-map-import.description"](): string;
    /**
      * `Block Meta`
      */
    ["com.yunke.settings.workspace.experimental-features.enable-block-meta.name"](): string;
    /**
      * `Once enabled, all blocks will have created time, updated time, created by and updated by.`
      */
    ["com.yunke.settings.workspace.experimental-features.enable-block-meta.description"](): string;
    /**
      * `Callout`
      */
    ["com.yunke.settings.workspace.experimental-features.enable-callout.name"](): string;
    /**
      * `Let your words stand out. This also include the callout in the transcription block.`
      */
    ["com.yunke.settings.workspace.experimental-features.enable-callout.description"](): string;
    /**
      * `Embed Iframe Block`
      */
    ["com.yunke.settings.workspace.experimental-features.enable-embed-iframe-block.name"](): string;
    /**
      * `Enables Embed Iframe Block.`
      */
    ["com.yunke.settings.workspace.experimental-features.enable-embed-iframe-block.description"](): string;
    /**
      * `Emoji Folder Icon`
      */
    ["com.yunke.settings.workspace.experimental-features.enable-emoji-folder-icon.name"](): string;
    /**
      * `Once enabled, you can use an emoji as the folder icon. When the first character of the folder name is an emoji, it will be extracted and used as its icon.`
      */
    ["com.yunke.settings.workspace.experimental-features.enable-emoji-folder-icon.description"](): string;
    /**
      * `Emoji Doc Icon`
      */
    ["com.yunke.settings.workspace.experimental-features.enable-emoji-doc-icon.name"](): string;
    /**
      * `Once enabled, you can use an emoji as the doc icon. When the first character of the doc name is an emoji, it will be extracted and used as its icon.`
      */
    ["com.yunke.settings.workspace.experimental-features.enable-emoji-doc-icon.description"](): string;
    /**
      * `Editor Settings`
      */
    ["com.yunke.settings.workspace.experimental-features.enable-editor-settings.name"](): string;
    /**
      * `Enables editor settings.`
      */
    ["com.yunke.settings.workspace.experimental-features.enable-editor-settings.description"](): string;
    /**
      * `Theme Editor`
      */
    ["com.yunke.settings.workspace.experimental-features.enable-theme-editor.name"](): string;
    /**
      * `Enables theme editor.`
      */
    ["com.yunke.settings.workspace.experimental-features.enable-theme-editor.description"](): string;
    /**
      * `Allow create local workspace`
      */
    ["com.yunke.settings.workspace.experimental-features.enable-local-workspace.name"](): string;
    /**
      * `Allow create local workspace`
      */
    ["com.yunke.settings.workspace.experimental-features.enable-local-workspace.description"](): string;
    /**
      * `Advanced block visibility control`
      */
    ["com.yunke.settings.workspace.experimental-features.enable-advanced-block-visibility.name"](): string;
    /**
      * `To provide detailed control over which edgeless blocks are visible in page mode.`
      */
    ["com.yunke.settings.workspace.experimental-features.enable-advanced-block-visibility.description"](): string;
    /**
      * `Mobile Keyboard Toolbar`
      */
    ["com.yunke.settings.workspace.experimental-features.enable-mobile-keyboard-toolbar.name"](): string;
    /**
      * `Enables the mobile keyboard toolbar.`
      */
    ["com.yunke.settings.workspace.experimental-features.enable-mobile-keyboard-toolbar.description"](): string;
    /**
      * `Mobile Linked Doc Widget`
      */
    ["com.yunke.settings.workspace.experimental-features.enable-mobile-linked-doc-menu.name"](): string;
    /**
      * `Enables the mobile linked doc menu.`
      */
    ["com.yunke.settings.workspace.experimental-features.enable-mobile-linked-doc-menu.description"](): string;
    /**
      * `Enable Snapshot Import Export`
      */
    ["com.yunke.settings.workspace.experimental-features.enable-snapshot-import-export.name"](): string;
    /**
      * `Once enabled, users can import and export blocksuite snapshots.`
      */
    ["com.yunke.settings.workspace.experimental-features.enable-snapshot-import-export.description"](): string;
    /**
      * `Enable Edgeless Editing`
      */
    ["com.yunke.settings.workspace.experimental-features.enable-mobile-edgeless-editing.name"](): string;
    /**
      * `Once enabled, users can edit edgeless canvas.`
      */
    ["com.yunke.settings.workspace.experimental-features.enable-mobile-edgeless-editing.description"](): string;
    /**
      * `PDF embed preview`
      */
    ["com.yunke.settings.workspace.experimental-features.enable-pdf-embed-preview.name"](): string;
    /**
      * `Once enabled, you can preview PDF in embed view.`
      */
    ["com.yunke.settings.workspace.experimental-features.enable-pdf-embed-preview.description"](): string;
    /**
      * `Audio block`
      */
    ["com.yunke.settings.workspace.experimental-features.enable-audio-block.name"](): string;
    /**
      * `Audio block allows you to play audio files globally and add notes to them.`
      */
    ["com.yunke.settings.workspace.experimental-features.enable-audio-block.description"](): string;
    /**
      * `Meetings`
      */
    ["com.yunke.settings.workspace.experimental-features.enable-meetings.name"](): string;
    /**
      * `Meetings allows you to record and transcribe meetings. Don't forget to enable it in YUNKE settings.`
      */
    ["com.yunke.settings.workspace.experimental-features.enable-meetings.description"](): string;
    /**
      * `Editor RTL`
      */
    ["com.yunke.settings.workspace.experimental-features.enable-editor-rtl.name"](): string;
    /**
      * `Once enabled, the editor will be displayed in RTL mode.`
      */
    ["com.yunke.settings.workspace.experimental-features.enable-editor-rtl.description"](): string;
    /**
      * `Edgeless scribbled style`
      */
    ["com.yunke.settings.workspace.experimental-features.enable-edgeless-scribbled-style.name"](): string;
    /**
      * `Once enabled, you can use scribbled style in edgeless mode.`
      */
    ["com.yunke.settings.workspace.experimental-features.enable-edgeless-scribbled-style.description"](): string;
    /**
      * `Database block table view virtual scroll`
      */
    ["com.yunke.settings.workspace.experimental-features.enable-table-virtual-scroll.name"](): string;
    /**
      * `Once enabled, switch table view to virtual scroll mode in Database Block.`
      */
    ["com.yunke.settings.workspace.experimental-features.enable-table-virtual-scroll.description"](): string;
    /**
      * `Code block HTML preview`
      */
    ["com.yunke.settings.workspace.experimental-features.enable-code-block-html-preview.name"](): string;
    /**
      * `Once enabled, you can preview HTML in code block.`
      */
    ["com.yunke.settings.workspace.experimental-features.enable-code-block-html-preview.description"](): string;
    /**
      * `Adapter Panel`
      */
    ["com.yunke.settings.workspace.experimental-features.enable-adapter-panel.name"](): string;
    /**
      * `Once enabled, you can preview adapter export content in the right side bar.`
      */
    ["com.yunke.settings.workspace.experimental-features.enable-adapter-panel.description"](): string;
    /**
      * `Only an owner can edit the workspace avatar and name. Changes will be shown for everyone.`
      */
    ["com.yunke.settings.workspace.not-owner"](): string;
    /**
      * `Preference`
      */
    ["com.yunke.settings.workspace.preferences"](): string;
    /**
      * `Team's Billing`
      */
    ["com.yunke.settings.workspace.billing"](): string;
    /**
      * `Team Workspace`
      */
    ["com.yunke.settings.workspace.billing.team-workspace"](): string;
    /**
      * `Your workspace is in a free trail period.`
      */
    ["com.yunke.settings.workspace.billing.team-workspace.description.free-trail"](): string;
    /**
      * `Your workspace is billed annually.`
      */
    ["com.yunke.settings.workspace.billing.team-workspace.description.billed.annually"](): string;
    /**
      * `Your workspace is billed monthly.`
      */
    ["com.yunke.settings.workspace.billing.team-workspace.description.billed.monthly"](): string;
    /**
      * `Your subscription will end on {{date}}`
      */
    ["com.yunke.settings.workspace.billing.team-workspace.not-renewed"](options: {
        readonly date: string;
    }): string;
    /**
      * `Next billing date: {{date}}`
      */
    ["com.yunke.settings.workspace.billing.team-workspace.next-billing-date"](options: {
        readonly date: string;
    }): string;
    /**
      * `Cancel Plan`
      */
    ["com.yunke.settings.workspace.billing.team-workspace.cancel-plan"](): string;
    /**
      * `License`
      */
    ["com.yunke.settings.workspace.license"](): string;
    /**
      * `Manage license information and invoices for the self host team workspace.`
      */
    ["com.yunke.settings.workspace.license.description"](): string;
    /**
      * `Get teams plan for your self hosted workspace.`
      */
    ["com.yunke.settings.workspace.license.benefit.team.title"](): string;
    /**
      * `Need more seats? Best for scalable teams.`
      */
    ["com.yunke.settings.workspace.license.benefit.team.subtitle"](): string;
    /**
      * `Everything in Self Hosted FOSS`
      */
    ["com.yunke.settings.workspace.license.benefit.team.g1"](): string;
    /**
      * `{{initialQuota}} initial storage + {{quotaPerSeat}} per seat`
      */
    ["com.yunke.settings.workspace.license.benefit.team.g2"](options: Readonly<{
        initialQuota: string;
        quotaPerSeat: string;
    }>): string;
    /**
      * `{{quota}} of maximum file size`
      */
    ["com.yunke.settings.workspace.license.benefit.team.g3"](options: {
        readonly quota: string;
    }): string;
    /**
      * `Unlimited team members (10+ seats)`
      */
    ["com.yunke.settings.workspace.license.benefit.team.g4"](): string;
    /**
      * `Multiple admin roles`
      */
    ["com.yunke.settings.workspace.license.benefit.team.g5"](): string;
    /**
      * `Priority customer support`
      */
    ["com.yunke.settings.workspace.license.benefit.team.g6"](): string;
    /**
      * `Lean more`
      */
    ["com.yunke.settings.workspace.license.lean-more"](): string;
    /**
      * `Selfhosted workspace`
      */
    ["com.yunke.settings.workspace.license.self-host"](): string;
    /**
      * `Self-host Team Workspace`
      */
    ["com.yunke.settings.workspace.license.self-host-team"](): string;
    /**
      * `This license will expire on {{expirationDate}}, with {{leftDays}} days remaining.`
      */
    ["com.yunke.settings.workspace.license.self-host-team.team.description"](options: Readonly<{
        expirationDate: string;
        leftDays: string;
    }>): string;
    /**
      * `Basic version: {{memberCount}} seats. For more, purchase or use activation key.`
      */
    ["com.yunke.settings.workspace.license.self-host-team.free.description"](options: {
        readonly memberCount: string;
    }): string;
    /**
      * `Seats`
      */
    ["com.yunke.settings.workspace.license.self-host-team.seats"](): string;
    /**
      * `Use purchased key`
      */
    ["com.yunke.settings.workspace.license.self-host-team.use-purchased-key"](): string;
    /**
      * `Upload license file`
      */
    ["com.yunke.settings.workspace.license.self-host-team.upload-license-file"](): string;
    /**
      * `Upload license file locally and verify the license information.`
      */
    ["com.yunke.settings.workspace.license.self-host-team.upload-license-file.description"](): string;
    /**
      * `To purchase a license:`
      */
    ["com.yunke.settings.workspace.license.self-host-team.upload-license-file.tips.title"](): string;
    /**
      * `Workspace id`
      */
    ["com.yunke.settings.workspace.license.self-host-team.upload-license-file.tips.workspace-id"](): string;
    /**
      * `Click to upload`
      */
    ["com.yunke.settings.workspace.license.self-host-team.upload-license-file.click-to-upload"](): string;
    /**
      * `Activation failed`
      */
    ["com.yunke.settings.workspace.license.self-host-team.upload-license-file.failed"](): string;
    /**
      * `Activation Success`
      */
    ["com.yunke.settings.workspace.license.self-host-team.upload-license-file.success.title"](): string;
    /**
      * `License has been successfully applied`
      */
    ["com.yunke.settings.workspace.license.self-host-team.upload-license-file.success.description"](): string;
    /**
      * `If you encounter any issues, contact support@toeverything.info.`
      */
    ["com.yunke.settings.workspace.license.self-host-team.upload-license-file.help"](): string;
    /**
      * `Deactivate`
      */
    ["com.yunke.settings.workspace.license.self-host-team.deactivate-license"](): string;
    /**
      * `Replace your license file`
      */
    ["com.yunke.settings.workspace.license.self-host-team.replace-license.title"](): string;
    /**
      * `Replace the existing license file with a new, updated version.`
      */
    ["com.yunke.settings.workspace.license.self-host-team.replace-license.description"](): string;
    /**
      * `Upload license file`
      */
    ["com.yunke.settings.workspace.license.self-host-team.replace-license.upload"](): string;
    /**
      * `Buy more seat`
      */
    ["com.yunke.settings.workspace.license.buy-more-seat"](): string;
    /**
      * `Activate License`
      */
    ["com.yunke.settings.workspace.license.activate-modal.title"](): string;
    /**
      * `Enter license key to activate this self host workspace.`
      */
    ["com.yunke.settings.workspace.license.activate-modal.description"](): string;
    /**
      * `License activated successfully.`
      */
    ["com.yunke.settings.workspace.license.activate-success"](): string;
    /**
      * `Confirm deactivation?`
      */
    ["com.yunke.settings.workspace.license.deactivate-modal.title"](): string;
    /**
      * `After deactivation, you will need to upload a new license to continue using team feature`
      */
    ["com.yunke.settings.workspace.license.deactivate-modal.description-license"](): string;
    /**
      * `Manage Payment`
      */
    ["com.yunke.settings.workspace.license.deactivate-modal.manage-payment"](): string;
    /**
      * `License deactivated successfully.`
      */
    ["com.yunke.settings.workspace.license.deactivate-success"](): string;
    /**
      * `Local`
      */
    ["com.yunke.settings.workspace.state.local"](): string;
    /**
      * `Sync with YUNKE Cloud`
      */
    ["com.yunke.settings.workspace.state.sync-yunke-cloud"](): string;
    /**
      * `Self-Hosted Server`
      */
    ["com.yunke.settings.workspace.state.self-hosted"](): string;
    /**
      * `Joined Workspace`
      */
    ["com.yunke.settings.workspace.state.joined"](): string;
    /**
      * `Available Offline`
      */
    ["com.yunke.settings.workspace.state.available-offline"](): string;
    /**
      * `Published to Web`
      */
    ["com.yunke.settings.workspace.state.published"](): string;
    /**
      * `Team Workspace`
      */
    ["com.yunke.settings.workspace.state.team"](): string;
    /**
      * `Properties`
      */
    ["com.yunke.settings.workspace.properties"](): string;
    /**
      * `Add property`
      */
    ["com.yunke.settings.workspace.properties.add_property"](): string;
    /**
      * `All`
      */
    ["com.yunke.settings.workspace.properties.all"](): string;
    /**
      * `Delete property`
      */
    ["com.yunke.settings.workspace.properties.delete-property"](): string;
    /**
      * `Edit property`
      */
    ["com.yunke.settings.workspace.properties.edit-property"](): string;
    /**
      * `General properties`
      */
    ["com.yunke.settings.workspace.properties.general-properties"](): string;
    /**
      * `Properties`
      */
    ["com.yunke.settings.workspace.properties.header.title"](): string;
    /**
      * `In use`
      */
    ["com.yunke.settings.workspace.properties.in-use"](): string;
    /**
      * `Readonly properties`
      */
    ["com.yunke.settings.workspace.properties.readonly-properties"](): string;
    /**
      * `Required properties`
      */
    ["com.yunke.settings.workspace.properties.required-properties"](): string;
    /**
      * `Set as required property`
      */
    ["com.yunke.settings.workspace.properties.set-as-required"](): string;
    /**
      * `Unused`
      */
    ["com.yunke.settings.workspace.properties.unused"](): string;
    /**
      * `You can view current workspace's storage and files here.`
      */
    ["com.yunke.settings.workspace.storage.subtitle"](): string;
    /**
      * `Enable YUNKE Cloud to publish this workspace`
      */
    ["com.yunke.settings.workspace.publish-tooltip"](): string;
    /**
      * `Sharing`
      */
    ["com.yunke.settings.workspace.sharing.title"](): string;
    /**
      * `Allow URL unfurling by Slack & other social apps, even if a doc is only accessible by workspace members.`
      */
    ["com.yunke.settings.workspace.sharing.url-preview.description"](): string;
    /**
      * `Always enable url preview`
      */
    ["com.yunke.settings.workspace.sharing.url-preview.title"](): string;
    /**
      * `YUNKE AI`
      */
    ["com.yunke.settings.workspace.yunke-ai.title"](): string;
    /**
      * `Allow YUNKE AI Assistant`
      */
    ["com.yunke.settings.workspace.yunke-ai.label"](): string;
    /**
      * `Allow workspace members to use YUNKE AI features. This setting doesn't affect billing. Workspace members use YUNKE AI through their personal accounts.`
      */
    ["com.yunke.settings.workspace.yunke-ai.description"](): string;
    /**
      * `Archived workspaces`
      */
    ["com.yunke.settings.workspace.backup"](): string;
    /**
      * `Manage archived local workspace files`
      */
    ["com.yunke.settings.workspace.backup.subtitle"](): string;
    /**
      * `No archived workspace files found`
      */
    ["com.yunke.settings.workspace.backup.empty"](): string;
    /**
      * `Delete archived workspace`
      */
    ["com.yunke.settings.workspace.backup.delete"](): string;
    /**
      * `Are you sure you want to delete this workspace. This action cannot be undone. Make sure you no longer need them before proceeding.`
      */
    ["com.yunke.settings.workspace.backup.delete.warning"](): string;
    /**
      * `Workspace backup deleted successfully`
      */
    ["com.yunke.settings.workspace.backup.delete.success"](): string;
    /**
      * `Workspace enabled successfully`
      */
    ["com.yunke.settings.workspace.backup.import.success"](): string;
    /**
      * `Enable local workspace`
      */
    ["com.yunke.settings.workspace.backup.import"](): string;
    /**
      * `Open`
      */
    ["com.yunke.settings.workspace.backup.import.success.action"](): string;
    /**
      * `Deleted on {{date}} at {{time}}`
      */
    ["com.yunke.settings.workspace.backup.delete-at"](options: Readonly<{
        date: string;
        time: string;
    }>): string;
    /**
      * `Indexer & Embedding`
      */
    ["com.yunke.settings.workspace.indexer-embedding.title"](): string;
    /**
      * `Manage YUNKE indexing and YUNKE AI Embedding for local content processing`
      */
    ["com.yunke.settings.workspace.indexer-embedding.description"](): string;
    /**
      * `Embedding`
      */
    ["com.yunke.settings.workspace.indexer-embedding.embedding.title"](): string;
    /**
      * `Embedding allows AI to retrieve your content. If the indexer uses local settings, it may affect some of the results of the Embedding.`
      */
    ["com.yunke.settings.workspace.indexer-embedding.embedding.description"](): string;
    /**
      * `Only the workspace owner can enable Workspace Embedding.`
      */
    ["com.yunke.settings.workspace.indexer-embedding.embedding.disabled-tooltip"](): string;
    /**
      * `Select doc`
      */
    ["com.yunke.settings.workspace.indexer-embedding.embedding.select-doc"](): string;
    /**
      * `Upload file`
      */
    ["com.yunke.settings.workspace.indexer-embedding.embedding.upload-file"](): string;
    /**
      * `Workspace Embedding`
      */
    ["com.yunke.settings.workspace.indexer-embedding.embedding.switch.title"](): string;
    /**
      * `AI can call files embedded in the workspace.`
      */
    ["com.yunke.settings.workspace.indexer-embedding.embedding.switch.description"](): string;
    /**
      * `Failed to update workspace doc embedding enabled`
      */
    ["com.yunke.settings.workspace.indexer-embedding.embedding.switch.error"](): string;
    /**
      * `Failed to remove attachment from embedding`
      */
    ["com.yunke.settings.workspace.indexer-embedding.embedding.remove-attachment.error"](): string;
    /**
      * `Failed to update ignored docs`
      */
    ["com.yunke.settings.workspace.indexer-embedding.embedding.update-ignored-docs.error"](): string;
    /**
      * `Embedding progress`
      */
    ["com.yunke.settings.workspace.indexer-embedding.embedding.progress.title"](): string;
    /**
      * `Syncing`
      */
    ["com.yunke.settings.workspace.indexer-embedding.embedding.progress.syncing"](): string;
    /**
      * `Synced`
      */
    ["com.yunke.settings.workspace.indexer-embedding.embedding.progress.synced"](): string;
    /**
      * `Loading sync status...`
      */
    ["com.yunke.settings.workspace.indexer-embedding.embedding.progress.loading-sync-status"](): string;
    /**
      * `Ignore Docs`
      */
    ["com.yunke.settings.workspace.indexer-embedding.embedding.ignore-docs.title"](): string;
    /**
      * `The Ignored docs will not be embedded into the current workspace.`
      */
    ["com.yunke.settings.workspace.indexer-embedding.embedding.ignore-docs.description"](): string;
    /**
      * `Additional attachments`
      */
    ["com.yunke.settings.workspace.indexer-embedding.embedding.additional-attachments.title"](): string;
    /**
      * `The uploaded file will be embedded in the current workspace.`
      */
    ["com.yunke.settings.workspace.indexer-embedding.embedding.additional-attachments.description"](): string;
    /**
      * `Remove the attachment from embedding?`
      */
    ["com.yunke.settings.workspace.indexer-embedding.embedding.additional-attachments.remove-attachment.title"](): string;
    /**
      * `Attachment will be removed. AI will not continue to extract content from this attachment.`
      */
    ["com.yunke.settings.workspace.indexer-embedding.embedding.additional-attachments.remove-attachment.description"](): string;
    /**
      * `Delete File`
      */
    ["com.yunke.settings.workspace.indexer-embedding.embedding.additional-attachments.remove-attachment.tooltip"](): string;
    /**
      * `Sharing doc requires YUNKE Cloud.`
      */
    ["com.yunke.share-menu.EnableCloudDescription"](): string;
    /**
      * `Share mode`
      */
    ["com.yunke.share-menu.ShareMode"](): string;
    /**
      * `Share doc`
      */
    ["com.yunke.share-menu.SharePage"](): string;
    /**
      * `General access`
      */
    ["com.yunke.share-menu.generalAccess"](): string;
    /**
      * `Share via export`
      */
    ["com.yunke.share-menu.ShareViaExport"](): string;
    /**
      * `Download a static copy of your doc to share with others`
      */
    ["com.yunke.share-menu.ShareViaExportDescription"](): string;
    /**
      * `Print a paper copy`
      */
    ["com.yunke.share-menu.ShareViaPrintDescription"](): string;
    /**
      * `Share with link`
      */
    ["com.yunke.share-menu.ShareWithLink"](): string;
    /**
      * `Create a link you can easily share with anyone. The visitors will open your doc in the form od a document`
      */
    ["com.yunke.share-menu.ShareWithLinkDescription"](): string;
    /**
      * `Shared doc`
      */
    ["com.yunke.share-menu.SharedPage"](): string;
    /**
      * `Copy Link`
      */
    ["com.yunke.share-menu.copy"](): string;
    /**
      * `Copy private link`
      */
    ["com.yunke.share-menu.copy-private-link"](): string;
    /**
      * `Copy Link to Selected Block`
      */
    ["com.yunke.share-menu.copy.block"](): string;
    /**
      * `Copy Link to Edgeless Mode`
      */
    ["com.yunke.share-menu.copy.edgeless"](): string;
    /**
      * `Copy Link to Selected Frame`
      */
    ["com.yunke.share-menu.copy.frame"](): string;
    /**
      * `Copy Link to Page Mode`
      */
    ["com.yunke.share-menu.copy.page"](): string;
    /**
      * `You can share this document with link.`
      */
    ["com.yunke.share-menu.create-public-link.notification.success.message"](): string;
    /**
      * `Public link created`
      */
    ["com.yunke.share-menu.create-public-link.notification.success.title"](): string;
    /**
      * `Please try again later.`
      */
    ["com.yunke.share-menu.disable-publish-link.notification.fail.message"](): string;
    /**
      * `Failed to disable public link`
      */
    ["com.yunke.share-menu.disable-publish-link.notification.fail.title"](): string;
    /**
      * `This doc is no longer shared publicly.`
      */
    ["com.yunke.share-menu.disable-publish-link.notification.success.message"](): string;
    /**
      * `Public link disabled`
      */
    ["com.yunke.share-menu.disable-publish-link.notification.success.title"](): string;
    /**
      * `Manage workspace members`
      */
    ["com.yunke.share-menu.navigate.workspace"](): string;
    /**
      * `Anyone with the link`
      */
    ["com.yunke.share-menu.option.link.label"](): string;
    /**
      * `No access`
      */
    ["com.yunke.share-menu.option.link.no-access"](): string;
    /**
      * `Only workspace members can access this link`
      */
    ["com.yunke.share-menu.option.link.no-access.description"](): string;
    /**
      * `Read only`
      */
    ["com.yunke.share-menu.option.link.readonly"](): string;
    /**
      * `Anyone can access this link`
      */
    ["com.yunke.share-menu.option.link.readonly.description"](): string;
    /**
      * `Can manage`
      */
    ["com.yunke.share-menu.option.permission.can-manage"](): string;
    /**
      * `Can edit`
      */
    ["com.yunke.share-menu.option.permission.can-edit"](): string;
    /**
      * `Can read`
      */
    ["com.yunke.share-menu.option.permission.can-read"](): string;
    /**
      * `No access`
      */
    ["com.yunke.share-menu.option.permission.no-access"](): string;
    /**
      * `Members in workspace`
      */
    ["com.yunke.share-menu.option.permission.label"](): string;
    /**
      * `Workspace admins and owner automatically have Can manage permissions.`
      */
    ["com.yunke.share-menu.option.permission.tips"](): string;
    /**
      * `Publish to web`
      */
    ["com.yunke.share-menu.publish-to-web"](): string;
    /**
      * `Share privately`
      */
    ["com.yunke.share-menu.share-privately"](): string;
    /**
      * `Share`
      */
    ["com.yunke.share-menu.shareButton"](): string;
    /**
      * `Shared`
      */
    ["com.yunke.share-menu.sharedButton"](): string;
    /**
      * `{{member1}} and {{member2}} are in this doc`
      */
    ["com.yunke.share-menu.member-management.member-count-2"](options: Readonly<{
        member1: string;
        member2: string;
    }>): string;
    /**
      * `{{member1}}, {{member2}} and {{member3}} are in this doc`
      */
    ["com.yunke.share-menu.member-management.member-count-3"](options: Readonly<{
        member1: string;
        member2: string;
        member3: string;
    }>): string;
    /**
      * `{{member1}}, {{member2}} and {{memberCount}} others`
      */
    ["com.yunke.share-menu.member-management.member-count-more"](options: Readonly<{
        member1: string;
        member2: string;
        memberCount: string;
    }>): string;
    /**
      * `Remove`
      */
    ["com.yunke.share-menu.member-management.remove"](): string;
    /**
      * `Set as owner`
      */
    ["com.yunke.share-menu.member-management.set-as-owner"](): string;
    /**
      * `Make this person the owner?`
      */
    ["com.yunke.share-menu.member-management.set-as-owner.confirm.title"](): string;
    /**
      * `The new owner will be effective immediately, and you might lose access to this doc if other users remove you, please confirm.`
      */
    ["com.yunke.share-menu.member-management.set-as-owner.confirm.description"](): string;
    /**
      * `Permission updated`
      */
    ["com.yunke.share-menu.member-management.update-success"](): string;
    /**
      * `Failed to update permission`
      */
    ["com.yunke.share-menu.member-management.update-fail"](): string;
    /**
      * `{{memberCount}} collaborators in the doc`
      */
    ["com.yunke.share-menu.member-management.header"](options: {
        readonly memberCount: string;
    }): string;
    /**
      * `Add collaborators`
      */
    ["com.yunke.share-menu.member-management.add-collaborators"](): string;
    /**
      * `Send invite`
      */
    ["com.yunke.share-menu.invite-editor.header"](): string;
    /**
      * `Manage members`
      */
    ["com.yunke.share-menu.invite-editor.manage-members"](): string;
    /**
      * `Invite`
      */
    ["com.yunke.share-menu.invite-editor.invite"](): string;
    /**
      * `No results found`
      */
    ["com.yunke.share-menu.invite-editor.no-found"](): string;
    /**
      * `Invite other members`
      */
    ["com.yunke.share-menu.invite-editor.placeholder"](): string;
    /**
      * `Notify via Email`
      */
    ["com.yunke.share-menu.invite-editor.sent-email"](): string;
    /**
      * `Permission not available in Free plan`
      */
    ["com.yunke.share-menu.paywall.owner.title"](): string;
    /**
      * `Upgrade to Pro or higher to unlock permission settings for this doc.`
      */
    ["com.yunke.share-menu.paywall.owner.description"](): string;
    /**
      * `Upgrade`
      */
    ["com.yunke.share-menu.paywall.owner.confirm"](): string;
    /**
      * `Permission requires a workspace upgrade`
      */
    ["com.yunke.share-menu.paywall.member.title"](): string;
    /**
      * `Ask your workspace owner to upgrade to Pro or higher to enable permissions.`
      */
    ["com.yunke.share-menu.paywall.member.description"](): string;
    /**
      * `Got it`
      */
    ["com.yunke.share-menu.paywall.member.confirm"](): string;
    /**
      * `Built with`
      */
    ["com.yunke.share-page.footer.built-with"](): string;
    /**
      * `Create with`
      */
    ["com.yunke.share-page.footer.create-with"](): string;
    /**
      * `Empower your sharing with YUNKE Cloud: One-click doc sharing`
      */
    ["com.yunke.share-page.footer.description"](): string;
    /**
      * `Get started for free`
      */
    ["com.yunke.share-page.footer.get-started"](): string;
    /**
      * `Use This Template`
      */
    ["com.yunke.share-page.header.import-template"](): string;
    /**
      * `Login or Sign Up`
      */
    ["com.yunke.share-page.header.login"](): string;
    /**
      * `Present`
      */
    ["com.yunke.share-page.header.present"](): string;
    /**
      * `Edgeless`
      */
    ["com.yunke.shortcutsTitle.edgeless"](): string;
    /**
      * `General`
      */
    ["com.yunke.shortcutsTitle.general"](): string;
    /**
      * `Markdown syntax`
      */
    ["com.yunke.shortcutsTitle.markdownSyntax"](): string;
    /**
      * `Page`
      */
    ["com.yunke.shortcutsTitle.page"](): string;
    /**
      * `Collapse sidebar`
      */
    ["com.yunke.sidebarSwitch.collapse"](): string;
    /**
      * `Expand sidebar`
      */
    ["com.yunke.sidebarSwitch.expand"](): string;
    /**
      * `Snapshot Imp. & Exp.`
      */
    ["com.yunke.snapshot.import-export.enable"](): string;
    /**
      * `Once enabled you can find the Snapshot Export Import option in the document's More menu.`
      */
    ["com.yunke.snapshot.import-export.enable.desc"](): string;
    /**
      * `Maybe later`
      */
    ["com.yunke.star-yunke.cancel"](): string;
    /**
      * `Star on GitHub`
      */
    ["com.yunke.star-yunke.confirm"](): string;
    /**
      * `Are you finding our app useful and enjoyable? We'd love your support to keep improving! A great way to help us out is by giving us a star on GitHub. This simple action can make a big difference and helps us continue to deliver the best experience for you.`
      */
    ["com.yunke.star-yunke.description"](): string;
    /**
      * `Star us on GitHub`
      */
    ["com.yunke.star-yunke.title"](): string;
    /**
      * `Change plan`
      */
    ["com.yunke.storage.change-plan"](): string;
    /**
      * `You have reached the maximum capacity limit for your current account`
      */
    ["com.yunke.storage.maximum-tips"](): string;
    /**
      * `Pro users will have unlimited storage capacity during the alpha test period of the team version`
      */
    ["com.yunke.storage.maximum-tips.pro"](): string;
    /**
      * `Plan`
      */
    ["com.yunke.storage.plan"](): string;
    /**
      * `YUNKE Cloud storage`
      */
    ["com.yunke.storage.title"](): string;
    /**
      * `Upgrade`
      */
    ["com.yunke.storage.upgrade"](): string;
    /**
      * `Space used`
      */
    ["com.yunke.storage.used.hint"](): string;
    /**
      * `Syncing`
      */
    ["com.yunke.syncing"](): string;
    /**
      * `{{count}} doc`
    
      * - com.yunke.tags.count_one: `{{count}} doc`
    
      * - com.yunke.tags.count_other: `{{count}} docs`
    
      * - com.yunke.tags.count_zero: `{{count}} doc`
      */
    ["com.yunke.tags.count"](options: {
        readonly count: string | number | bigint;
    }): string;
    /**
      * `{{count}} doc`
      */
    ["com.yunke.tags.count_one"](options: {
        readonly count: string | number | bigint;
    }): string;
    /**
      * `{{count}} docs`
      */
    ["com.yunke.tags.count_other"](options: {
        readonly count: string | number | bigint;
    }): string;
    /**
      * `{{count}} doc`
      */
    ["com.yunke.tags.count_zero"](options: {
        readonly count: string | number | bigint;
    }): string;
    /**
      * `Type tag name here...`
      */
    ["com.yunke.tags.create-tag.placeholder"](): string;
    /**
      * `Tag already exists`
      */
    ["com.yunke.tags.create-tag.toast.exist"](): string;
    /**
      * `Tag created`
      */
    ["com.yunke.tags.create-tag.toast.success"](): string;
    /**
      * `Tag deleted`
      */
    ["com.yunke.tags.delete-tags.toast"](): string;
    /**
      * `Tag updated`
      */
    ["com.yunke.tags.edit-tag.toast.success"](): string;
    /**
      * `New tag`
      */
    ["com.yunke.tags.empty.new-tag-button"](): string;
    /**
      * `Enable telemetry`
      */
    ["com.yunke.telemetry.enable"](): string;
    /**
      * `Telemetry is a feature that allows us to collect data on how you use the app. This data helps us improve the app and provide better features.`
      */
    ["com.yunke.telemetry.enable.desc"](): string;
    /**
      * `Dark`
      */
    ["com.yunke.themeSettings.dark"](): string;
    /**
      * `Light`
      */
    ["com.yunke.themeSettings.light"](): string;
    /**
      * `System`
      */
    ["com.yunke.themeSettings.system"](): string;
    /**
      * `Auto`
      */
    ["com.yunke.themeSettings.auto"](): string;
    /**
      * `now`
      */
    ["com.yunke.time.now"](): string;
    /**
      * `this month`
      */
    ["com.yunke.time.this-mouth"](): string;
    /**
      * `this week`
      */
    ["com.yunke.time.this-week"](): string;
    /**
      * `this year`
      */
    ["com.yunke.time.this-year"](): string;
    /**
      * `today`
      */
    ["com.yunke.time.today"](): string;
    /**
      * `Successfully added linked doc`
      */
    ["com.yunke.toastMessage.addLinkedPage"](): string;
    /**
      * `Added to favorites`
      */
    ["com.yunke.toastMessage.addedFavorites"](): string;
    /**
      * `Edgeless mode`
      */
    ["com.yunke.toastMessage.edgelessMode"](): string;
    /**
      * `Moved to trash`
      */
    ["com.yunke.toastMessage.movedTrash"](): string;
    /**
      * `Page Mode`
      */
    ["com.yunke.toastMessage.pageMode"](): string;
    /**
      * `Default mode has changed`
      */
    ["com.yunke.toastMessage.defaultMode.page.title"](): string;
    /**
      * `The default mode for this document has been changed to Page mode`
      */
    ["com.yunke.toastMessage.defaultMode.page.message"](): string;
    /**
      * `Default mode has changed`
      */
    ["com.yunke.toastMessage.defaultMode.edgeless.title"](): string;
    /**
      * `The default mode for this document has been changed to Edgeless mode`
      */
    ["com.yunke.toastMessage.defaultMode.edgeless.message"](): string;
    /**
      * `Permanently deleted`
      */
    ["com.yunke.toastMessage.permanentlyDeleted"](): string;
    /**
      * `Removed from favourites`
      */
    ["com.yunke.toastMessage.removedFavorites"](): string;
    /**
      * `Successfully renamed`
      */
    ["com.yunke.toastMessage.rename"](): string;
    /**
      * `{{title}} restored`
      */
    ["com.yunke.toastMessage.restored"](options: {
        readonly title: string;
    }): string;
    /**
      * `Successfully deleted`
      */
    ["com.yunke.toastMessage.successfullyDeleted"](): string;
    /**
      * `Today`
      */
    ["com.yunke.today"](): string;
    /**
      * `Tomorrow`
      */
    ["com.yunke.tomorrow"](): string;
    /**
      * `Last {{weekday}}`
      */
    ["com.yunke.last-week"](options: {
        readonly weekday: string;
    }): string;
    /**
      * `Next {{weekday}}`
      */
    ["com.yunke.next-week"](options: {
        readonly weekday: string;
    }): string;
    /**
      * `Limited to view-only on mobile.`
      */
    ["com.yunke.top-tip.mobile"](): string;
    /**
      * `Delete`
      */
    ["com.yunke.trashOperation.delete"](): string;
    /**
      * `Once deleted, you can't undo this action. Do you confirm?`
      */
    ["com.yunke.trashOperation.delete.description"](): string;
    /**
      * `Permanently delete`
      */
    ["com.yunke.trashOperation.delete.title"](): string;
    /**
      * `Once deleted, you can't undo this action. Do you confirm?`
      */
    ["com.yunke.trashOperation.deleteDescription"](): string;
    /**
      * `Delete permanently`
      */
    ["com.yunke.trashOperation.deletePermanently"](): string;
    /**
      * `Restore it`
      */
    ["com.yunke.trashOperation.restoreIt"](): string;
    /**
      * `Refresh current page`
      */
    ["com.yunke.upgrade.button-text.done"](): string;
    /**
      * `Data upgrade error`
      */
    ["com.yunke.upgrade.button-text.error"](): string;
    /**
      * `Upgrade workspace data`
      */
    ["com.yunke.upgrade.button-text.pending"](): string;
    /**
      * `Upgrading`
      */
    ["com.yunke.upgrade.button-text.upgrading"](): string;
    /**
      * `After upgrading the workspace data, please refresh the page to see the changes.`
      */
    ["com.yunke.upgrade.tips.done"](): string;
    /**
      * `We encountered some errors while upgrading the workspace data.`
      */
    ["com.yunke.upgrade.tips.error"](): string;
    /**
      * `To ensure compatibility with the updated YUNKE client, please upgrade your data by clicking the "Upgrade workspace data" button below.`
      */
    ["com.yunke.upgrade.tips.normal"](): string;
    /**
      * `AI usage`
      */
    ["com.yunke.user-info.usage.ai"](): string;
    /**
      * `Cloud storage`
      */
    ["com.yunke.user-info.usage.cloud"](): string;
    /**
      * `Close`
      */
    ["com.yunke.workbench.split-view-menu.close"](): string;
    /**
      * `Full screen`
      */
    ["com.yunke.workbench.split-view-menu.full-screen"](): string;
    /**
      * `Solo view`
      */
    ["com.yunke.workbench.split-view-menu.keep-this-one"](): string;
    /**
      * `Move left`
      */
    ["com.yunke.workbench.split-view-menu.move-left"](): string;
    /**
      * `Move right`
      */
    ["com.yunke.workbench.split-view-menu.move-right"](): string;
    /**
      * `Open in split view`
      */
    ["com.yunke.workbench.split-view.page-menu-open"](): string;
    /**
      * `Open in new tab`
      */
    ["com.yunke.workbench.tab.page-menu-open"](): string;
    /**
      * `You cannot delete the last workspace`
      */
    ["com.yunke.workspace.cannot-delete"](): string;
    /**
      * `Cloud workspaces`
      */
    ["com.yunke.workspace.cloud"](): string;
    /**
      * `Sign out`
      */
    ["com.yunke.workspace.cloud.account.logout"](): string;
    /**
      * `Account settings`
      */
    ["com.yunke.workspace.cloud.account.settings"](): string;
    /**
      * `Admin panel`
      */
    ["com.yunke.workspace.cloud.account.admin"](): string;
    /**
      * `Team owner`
      */
    ["com.yunke.workspace.cloud.account.team.owner"](): string;
    /**
      * `Team member`
      */
    ["com.yunke.workspace.cloud.account.team.member"](): string;
    /**
      * `Multiple teams`
      */
    ["com.yunke.workspace.cloud.account.team.multi"](): string;
    /**
      * `Click to open workspace`
      */
    ["com.yunke.workspace.cloud.account.team.tips-1"](): string;
    /**
      * `Click to open workspace list`
      */
    ["com.yunke.workspace.cloud.account.team.tips-2"](): string;
    /**
      * `Sign up/ Sign in`
      */
    ["com.yunke.workspace.cloud.auth"](): string;
    /**
      * `Sync with YUNKE Cloud`
      */
    ["com.yunke.workspace.cloud.description"](): string;
    /**
      * `Join workspace`
      */
    ["com.yunke.workspace.cloud.join"](): string;
    /**
      * `Cloud sync`
      */
    ["com.yunke.workspace.cloud.sync"](): string;
    /**
      * `Failed to enable Cloud, please try again.`
      */
    ["com.yunke.workspace.enable-cloud.failed"](): string;
    /**
      * `Local workspaces`
      */
    ["com.yunke.workspace.local"](): string;
    /**
      * `Import workspace`
      */
    ["com.yunke.workspace.local.import"](): string;
    /**
      * `Cancel`
      */
    ["com.yunke.workspaceDelete.button.cancel"](): string;
    /**
      * `Delete`
      */
    ["com.yunke.workspaceDelete.button.delete"](): string;
    /**
      * `Please type workspace name to confirm`
      */
    ["com.yunke.workspaceDelete.placeholder"](): string;
    /**
      * `Delete workspace`
      */
    ["com.yunke.workspaceDelete.title"](): string;
    /**
      * `Create workspace`
      */
    ["com.yunke.workspaceList.addWorkspace.create"](): string;
    /**
      * `Create cloud workspace`
      */
    ["com.yunke.workspaceList.addWorkspace.create-cloud"](): string;
    /**
      * `Cloud sync`
      */
    ["com.yunke.workspaceList.workspaceListType.cloud"](): string;
    /**
      * `Local storage`
      */
    ["com.yunke.workspaceList.workspaceListType.local"](): string;
    /**
      * `Add Server`
      */
    ["com.yunke.workspaceList.addServer"](): string;
    /**
      * `All docs`
      */
    ["com.yunke.workspaceSubPath.all"](): string;
    /**
      * `Trash`
      */
    ["com.yunke.workspaceSubPath.trash"](): string;
    /**
      * `Deleted docs will appear here.`
      */
    ["com.yunke.workspaceSubPath.trash.empty-description"](): string;
    /**
      * `Write with a blank page`
      */
    ["com.yunke.write_with_a_blank_page"](): string;
    /**
      * `Yesterday`
      */
    ["com.yunke.yesterday"](): string;
    /**
      * `Inactive`
      */
    ["com.yunke.inactive"](): string;
    /**
      * `Inactive member`
      */
    ["com.yunke.inactive-member"](): string;
    /**
      * `Inactive workspace`
      */
    ["com.yunke.inactive-workspace"](): string;
    /**
      * `Display Properties`
      */
    ["com.yunke.all-docs.display.properties"](): string;
    /**
      * `List view options`
      */
    ["com.yunke.all-docs.display.list-view"](): string;
    /**
      * `Icon`
      */
    ["com.yunke.all-docs.display.list-view.icon"](): string;
    /**
      * `Body`
      */
    ["com.yunke.all-docs.display.list-view.body"](): string;
    /**
      * `Quick actions`
      */
    ["com.yunke.all-docs.quick-actions"](): string;
    /**
      * `Favorite`
      */
    ["com.yunke.all-docs.quick-action.favorite"](): string;
    /**
      * `Move to trash`
      */
    ["com.yunke.all-docs.quick-action.trash"](): string;
    /**
      * `Open in split view`
      */
    ["com.yunke.all-docs.quick-action.split"](): string;
    /**
      * `Open in new tab`
      */
    ["com.yunke.all-docs.quick-action.tab"](): string;
    /**
      * `Select checkbox`
      */
    ["com.yunke.all-docs.quick-action.select"](): string;
    /**
      * `Delete permanently`
      */
    ["com.yunke.all-docs.quick-action.delete-permanently"](): string;
    /**
      * `Restore`
      */
    ["com.yunke.all-docs.quick-action.restore"](): string;
    /**
      * `All`
      */
    ["com.yunke.all-docs.pinned-collection.all"](): string;
    /**
      * `Edit collection rules`
      */
    ["com.yunke.all-docs.pinned-collection.edit"](): string;
    /**
      * `Template`
      */
    ["com.yunke.all-docs.group.is-template"](): string;
    /**
      * `Not Template`
      */
    ["com.yunke.all-docs.group.is-not-template"](): string;
    /**
      * `Journal`
      */
    ["com.yunke.all-docs.group.is-journal"](): string;
    /**
      * `Not Journal`
      */
    ["com.yunke.all-docs.group.is-not-journal"](): string;
    /**
      * `Checked`
      */
    ["com.yunke.all-docs.group.is-checked"](): string;
    /**
      * `Unchecked`
      */
    ["com.yunke.all-docs.group.is-not-checked"](): string;
    /**
      * `Never updated`
      */
    ["com.yunke.all-docs.group.updated-at.never-updated"](): string;
    /**
      * `core`
      */
    core(): string;
    /**
      * `Dark`
      */
    dark(): string;
    /**
      * `invited you to join`
      */
    ["invited you to join"](): string;
    /**
      * `Light`
      */
    light(): string;
    /**
      * `Others`
      */
    others(): string;
    /**
      * `System`
      */
    system(): string;
    /**
      * `unnamed`
      */
    unnamed(): string;
    /**
      * `Please upgrade to the latest version of Chrome for the best experience.`
      */
    upgradeBrowser(): string;
    /**
      * `Workspace properties`
      */
    ["com.yunke.workspace.properties"](): string;
    /**
      * `Rename to "{{name}}"`
      */
    ["com.yunke.m.rename-to"](options: {
        readonly name: string;
    }): string;
    /**
      * `Rename`
      */
    ["com.yunke.m.explorer.folder.rename"](): string;
    /**
      * `Create Folder`
      */
    ["com.yunke.m.explorer.folder.new-dialog-title"](): string;
    /**
      * `Organize`
      */
    ["com.yunke.m.explorer.folder.root"](): string;
    /**
      * `Create a folder in the {{parent}}.`
      */
    ["com.yunke.m.explorer.folder.new-tip-empty"](options: {
        readonly parent: string;
    }): string;
    /**
      * `Create "{{value}}" in the {{parent}}.`
      */
    ["com.yunke.m.explorer.folder.new-tip-not-empty"](options: Readonly<{
        value: string;
        parent: string;
    }>): string;
    /**
      * `Done`
      */
    ["com.yunke.m.explorer.folder.rename-confirm"](): string;
    /**
      * `Rename`
      */
    ["com.yunke.m.explorer.tag.rename"](): string;
    /**
      * `Rename Tag`
      */
    ["com.yunke.m.explorer.tag.rename-menu-title"](): string;
    /**
      * `Create Tag`
      */
    ["com.yunke.m.explorer.tag.new-dialog-title"](): string;
    /**
      * `Done`
      */
    ["com.yunke.m.explorer.tag.rename-confirm"](): string;
    /**
      * `Create a tag in this workspace.`
      */
    ["com.yunke.m.explorer.tag.new-tip-empty"](): string;
    /**
      * `Create "{{value}}" tag in this workspace.`
      */
    ["com.yunke.m.explorer.tag.new-tip-not-empty"](options: {
        readonly value: string;
    }): string;
    /**
      * `Manage Doc(s)`
      */
    ["com.yunke.m.explorer.tag.manage-docs"](): string;
    /**
      * `Rename`
      */
    ["com.yunke.m.explorer.collection.rename"](): string;
    /**
      * `Rename Collection`
      */
    ["com.yunke.m.explorer.collection.rename-menu-title"](): string;
    /**
      * `Create Collection`
      */
    ["com.yunke.m.explorer.collection.new-dialog-title"](): string;
    /**
      * `Rename`
      */
    ["com.yunke.m.explorer.doc.rename"](): string;
    /**
      * `Doc`
      */
    ["com.yunke.m.selector.type-doc"](): string;
    /**
      * `Tag`
      */
    ["com.yunke.m.selector.type-tag"](): string;
    /**
      * `Collection`
      */
    ["com.yunke.m.selector.type-collection"](): string;
    /**
      * `Folder`
      */
    ["com.yunke.m.selector.where-folder"](): string;
    /**
      * `Tag`
      */
    ["com.yunke.m.selector.where-tag"](): string;
    /**
      * `Collection`
      */
    ["com.yunke.m.selector.where-collection"](): string;
    /**
      * `Apply`
      */
    ["com.yunke.m.selector.confirm-default"](): string;
    /**
      * `Manage {{type}}(s)`
      */
    ["com.yunke.m.selector.title"](options: {
        readonly type: string;
    }): string;
    /**
      * `{{total}} item(s)`
      */
    ["com.yunke.m.selector.info-total"](options: {
        readonly total: string;
    }): string;
    /**
      * `Add {{count}} {{type}}(s)`
      */
    ["com.yunke.m.selector.info-added"](options: Readonly<{
        count: string;
        type: string;
    }>): string;
    /**
      * `Remove {{count}} {{type}}(s)`
      */
    ["com.yunke.m.selector.info-removed"](options: Readonly<{
        count: string;
        type: string;
    }>): string;
    /**
      * `Remove items`
      */
    ["com.yunke.m.selector.remove-warning.title"](): string;
    /**
      * `You unchecked {{type}} that already exist in the current {{where}}, which means you will remove them from this {{where}}. The item will not be deleted.`
      */
    ["com.yunke.m.selector.remove-warning.message"](options: Readonly<{
        type: string;
        where: string;
    }>): string;
    /**
      * `Do not ask again`
      */
    ["com.yunke.m.selector.remove-warning.confirm"](): string;
    /**
      * `Cancel`
      */
    ["com.yunke.m.selector.remove-warning.cancel"](): string;
    /**
      * `tag`
      */
    ["com.yunke.m.selector.remove-warning.where-tag"](): string;
    /**
      * `folder`
      */
    ["com.yunke.m.selector.remove-warning.where-folder"](): string;
    /**
      * `Today's activity`
      */
    ["com.yunke.m.selector.journal-menu.today-activity"](): string;
    /**
      * `Duplicate Entries in Today's Journal`
      */
    ["com.yunke.m.selector.journal-menu.conflicts"](): string;
    /**
      * `Unable to preview this file`
      */
    ["com.yunke.attachment.preview.error.title"](): string;
    /**
      * `file type not supported.`
      */
    ["com.yunke.attachment.preview.error.subtitle"](): string;
    /**
      * `Failed to render page.`
      */
    ["com.yunke.pdf.page.render.error"](): string;
    /**
      * `Duplicate Entries in Today's Journal`
      */
    ["com.yunke.editor.journal-conflict.title"](): string;
    /**
      * `Search for "{{query}}"`
      */
    ["com.yunke.editor.at-menu.link-to-doc"](options: {
        readonly query: string;
    }): string;
    /**
      * `Recent`
      */
    ["com.yunke.editor.at-menu.recent-docs"](): string;
    /**
      * `Tags`
      */
    ["com.yunke.editor.at-menu.tags"](): string;
    /**
      * `Collections`
      */
    ["com.yunke.editor.at-menu.collections"](): string;
    /**
      * `Loading...`
      */
    ["com.yunke.editor.at-menu.loading"](): string;
    /**
      * `New`
      */
    ["com.yunke.editor.at-menu.new-doc"](): string;
    /**
      * `New "{{name}}" page`
      */
    ["com.yunke.editor.at-menu.create-page"](options: {
        readonly name: string;
    }): string;
    /**
      * `New "{{name}}" edgeless`
      */
    ["com.yunke.editor.at-menu.create-edgeless"](options: {
        readonly name: string;
    }): string;
    /**
      * `Import`
      */
    ["com.yunke.editor.at-menu.import"](): string;
    /**
      * `{{count}} more docs`
      */
    ["com.yunke.editor.at-menu.more-docs-hint"](options: {
        readonly count: string;
    }): string;
    /**
      * `{{count}} more members`
      */
    ["com.yunke.editor.at-menu.more-members-hint"](options: {
        readonly count: string;
    }): string;
    /**
      * `Journal`
      */
    ["com.yunke.editor.at-menu.journal"](): string;
    /**
      * `Select a specific date`
      */
    ["com.yunke.editor.at-menu.date-picker"](): string;
    /**
      * `Mention Members`
      */
    ["com.yunke.editor.at-menu.mention-members"](): string;
    /**
      * `Member not notified`
      */
    ["com.yunke.editor.at-menu.member-not-notified"](): string;
    /**
      * `This member does not have access to this doc, they are not notified.`
      */
    ["com.yunke.editor.at-menu.member-not-notified-message"](): string;
    /**
      * `Invited and notified`
      */
    ["com.yunke.editor.at-menu.invited-and-notified"](): string;
    /**
      * `Access needed`
      */
    ["com.yunke.editor.at-menu.access-needed"](): string;
    /**
      * `{{username}} does not have access to this doc, do you want to invite and notify them?`
      */
    ["com.yunke.editor.at-menu.access-needed-message"](options: {
        readonly username: string;
    }): string;
    /**
      * `Show`
      */
    ["com.yunke.editor.bi-directional-link-panel.show"](): string;
    /**
      * `Hide`
      */
    ["com.yunke.editor.bi-directional-link-panel.hide"](): string;
    /**
      * `Fold page block`
      */
    ["com.yunke.editor.edgeless-note-header.fold-page-block"](): string;
    /**
      * `Open in Page`
      */
    ["com.yunke.editor.edgeless-note-header.open-in-page"](): string;
    /**
      * `Fold`
      */
    ["com.yunke.editor.edgeless-embed-synced-doc-header.fold"](): string;
    /**
      * `Unfold`
      */
    ["com.yunke.editor.edgeless-embed-synced-doc-header.unfold"](): string;
    /**
      * `Open`
      */
    ["com.yunke.editor.edgeless-embed-synced-doc-header.open"](): string;
    /**
      * `Empower Your Team with Seamless Collaboration`
      */
    ["com.yunke.upgrade-to-team-page.title"](): string;
    /**
      * `Select an existing workspace or create a new one`
      */
    ["com.yunke.upgrade-to-team-page.workspace-selector.placeholder"](): string;
    /**
      * `Create Workspace`
      */
    ["com.yunke.upgrade-to-team-page.workspace-selector.create-workspace"](): string;
    /**
      * `Upgrade to Team Workspace`
      */
    ["com.yunke.upgrade-to-team-page.upgrade-button"](): string;
    /**
      * `Team Workspace gives you everything you need for seamless team collaboration:`
      */
    ["com.yunke.upgrade-to-team-page.benefit.title"](): string;
    /**
      * `Invite unlimited members to your workspace`
      */
    ["com.yunke.upgrade-to-team-page.benefit.g1"](): string;
    /**
      * `Set custom roles and permissions for better control`
      */
    ["com.yunke.upgrade-to-team-page.benefit.g2"](): string;
    /**
      * `Access advanced team management features`
      */
    ["com.yunke.upgrade-to-team-page.benefit.g3"](): string;
    /**
      * `Get priority customer support`
      */
    ["com.yunke.upgrade-to-team-page.benefit.g4"](): string;
    /**
      * `Perfect for growing teams and organizations that need professional collaboration tools.`
      */
    ["com.yunke.upgrade-to-team-page.benefit.description"](): string;
    /**
      * `Upgrade to Team Workspace`
      */
    ["com.yunke.upgrade-to-team-page.upgrade-confirm.title"](): string;
    /**
      * `Name Your Workspace`
      */
    ["com.yunke.upgrade-to-team-page.create-and-upgrade-confirm.title"](): string;
    /**
      * `A workspace is your virtual space to capture, create and plan as just one person or together as a team.`
      */
    ["com.yunke.upgrade-to-team-page.create-and-upgrade-confirm.description"](): string;
    /**
      * `Set a workspace name`
      */
    ["com.yunke.upgrade-to-team-page.create-and-upgrade-confirm.placeholder"](): string;
    /**
      * `Continue to Pricing`
      */
    ["com.yunke.upgrade-to-team-page.create-and-upgrade-confirm.confirm"](): string;
    /**
      * `No workspace available`
      */
    ["com.yunke.upgrade-to-team-page.no-workspace-available"](): string;
    /**
      * `Workspace storage`
      */
    ["com.yunke.workspace.storage"](): string;
    /**
      * `Journal`
      */
    ["com.yunke.cmdk.yunke.category.yunke.journal"](): string;
    /**
      * `Select a specific date`
      */
    ["com.yunke.cmdk.yunke.category.yunke.date-picker"](): string;
    /**
      * `Workspace sync paused`
      */
    ["com.yunke.payment.sync-paused.title"](): string;
    /**
      * `Your workspace has exceeded both storage and member limits, causing synchronization to pause. To resume syncing, please either:`
      */
    ["com.yunke.payment.sync-paused.owner.both.description"](): string;
    /**
      * `Reduce storage usage and remove some team members`
      */
    ["com.yunke.payment.sync-paused.owner.both.tips-1"](): string;
    /**
      * `Upgrade your plan for increased capacity`
      */
    ["com.yunke.payment.sync-paused.owner.both.tips-2"](): string;
    /**
      * `Your workspace has exceeded its storage limit and synchronization has been paused. To resume syncing, please either:`
      */
    ["com.yunke.payment.sync-paused.owner.storage.description"](): string;
    /**
      * `Remove unnecessary files or content to reduce storage usage`
      */
    ["com.yunke.payment.sync-paused.owner.storage.tips-1"](): string;
    /**
      * `Upgrade your plan for increased storage capacity`
      */
    ["com.yunke.payment.sync-paused.owner.storage.tips-2"](): string;
    /**
      * `Your workspace has reached its maximum member capacity and synchronization has been paused. To resume syncing, you can either`
      */
    ["com.yunke.payment.sync-paused.owner.member.description"](): string;
    /**
      * `Remove some team members from the workspace`
      */
    ["com.yunke.payment.sync-paused.owner.member.tips-1"](): string;
    /**
      * `Upgrade your plan to accommodate more members`
      */
    ["com.yunke.payment.sync-paused.owner.member.tips-2"](): string;
    /**
      * `This workspace has exceeded both storage and member limits, causing synchronization to pause. Please contact your workspace owner to address these limits and resume syncing.`
      */
    ["com.yunke.payment.sync-paused.member.both.description"](): string;
    /**
      * `This workspace has exceeded its storage limit and synchronization has been paused. Please contact your workspace owner to either reduce storage usage or upgrade the plan to resume syncing.`
      */
    ["com.yunke.payment.sync-paused.member.storage.description"](): string;
    /**
      * `This workspace has reached its maximum member capacity and synchronization has been paused. Please contact your workspace owner to either adjust team membership or upgrade the plan to resume syncing.`
      */
    ["com.yunke.payment.sync-paused.member.member.description"](): string;
    /**
      * `Got It`
      */
    ["com.yunke.payment.sync-paused.member.member.confirm"](): string;
    /**
      * `Delete Server`
      */
    ["com.yunke.server.delete"](): string;
    /**
      * `Start`
      */
    ["com.yunke.page-starter-bar.start"](): string;
    /**
      * `Template`
      */
    ["com.yunke.page-starter-bar.template"](): string;
    /**
      * `With AI`
      */
    ["com.yunke.page-starter-bar.ai"](): string;
    /**
      * `Edgeless`
      */
    ["com.yunke.page-starter-bar.edgeless"](): string;
    /**
      * `Unsupported message`
      */
    ["com.yunke.notification.unsupported"](): string;
    /**
      * `No new notifications`
      */
    ["com.yunke.notification.empty"](): string;
    /**
      * `Loading more...`
      */
    ["com.yunke.notification.loading-more"](): string;
    /**
      * `You'll be notified here for @mentions and workspace invites.`
      */
    ["com.yunke.notification.empty.description"](): string;
    /**
      * `Open workspace`
      */
    ["com.yunke.notification.invitation-review-approved.open-workspace"](): string;
    /**
      * `Accept & Join`
      */
    ["com.yunke.notification.invitation.accept"](): string;
    /**
      * `Tips`
      */
    tips(): string;
    /**
      * `Template`
      */
    Template(): string;
    /**
      * `Delete Template`
      */
    ["com.yunke.template-list.delete"](): string;
    /**
      * `No template`
      */
    ["com.yunke.template-list.empty"](): string;
    /**
      * `Create new template`
      */
    ["com.yunke.template-list.create-new"](): string;
    /**
      * `Set a Template for the Journal`
      */
    ["com.yunke.template-journal-onboarding.title"](): string;
    /**
      * `Select`
      */
    ["com.yunke.template-journal-onboarding.select"](): string;
    /**
      * `My Templates`
      */
    ["com.yunke.settings.workspace.template.title"](): string;
    /**
      * `Template for journal`
      */
    ["com.yunke.settings.workspace.template.journal"](): string;
    /**
      * `Select a template for your journal`
      */
    ["com.yunke.settings.workspace.template.journal-desc"](): string;
    /**
      * `Keep empty`
      */
    ["com.yunke.settings.workspace.template.keep-empty"](): string;
    /**
      * `New doc with template`
      */
    ["com.yunke.settings.workspace.template.page"](): string;
    /**
      * `New docs will use the specified template, ignoring default settings.`
      */
    ["com.yunke.settings.workspace.template.page-desc"](): string;
    /**
      * `Template for new doc`
      */
    ["com.yunke.settings.workspace.template.page-select"](): string;
    /**
      * `Remove template`
      */
    ["com.yunke.settings.workspace.template.remove"](): string;
    /**
      * `You don't have permission to do this`
      */
    ["com.yunke.no-permission"](): string;
    /**
      * `Unused blobs`
      */
    ["com.yunke.settings.workspace.storage.unused-blobs"](): string;
    /**
      * `No unused blobs`
      */
    ["com.yunke.settings.workspace.storage.unused-blobs.empty"](): string;
    /**
      * `Selected`
      */
    ["com.yunke.settings.workspace.storage.unused-blobs.selected"](): string;
    /**
      * `Delete blob files`
      */
    ["com.yunke.settings.workspace.storage.unused-blobs.delete.title"](): string;
    /**
      * `Are you sure you want to delete these blob files? This action cannot be undone. Make sure you no longer need them before proceeding.`
      */
    ["com.yunke.settings.workspace.storage.unused-blobs.delete.warning"](): string;
    /**
      * `Join Failed`
      */
    ["com.yunke.fail-to-join-workspace.title"](): string;
    /**
      * `Please contact your workspace owner to add more seats.`
      */
    ["com.yunke.fail-to-join-workspace.description-2"](): string;
    /**
      * `Request to join`
      */
    ["com.yunke.request-to-join-workspace.button"](): string;
    /**
      * `Request Sent successfully`
      */
    ["com.yunke.sent-request-to-join-workspace.title"](): string;
    /**
      * `Request failed to send`
      */
    ["com.yunke.failed-to-send-request.title"](): string;
    /**
      * `Readwise`
      */
    ["com.yunke.integration.name.readwise"](): string;
    /**
      * `Integrations`
      */
    ["com.yunke.integration.integrations"](): string;
    /**
      * `Web Clipper`
      */
    ["com.yunke.integration.web-clipper.name"](): string;
    /**
      * `Import web pages to YUNKE`
      */
    ["com.yunke.integration.web-clipper.desc"](): string;
    /**
      * `Elevate your YUNKE experience with diverse add-ons and seamless integrations.`
      */
    ["com.yunke.integration.setting.description"](): string;
    /**
      * `Learn how to develop a integration for YUNKE`
      */
    ["com.yunke.integration.setting.learn"](): string;
    /**
      * `Readwise`
      */
    ["com.yunke.integration.readwise.name"](): string;
    /**
      * `Manually import your content to YUNKE from Readwise`
      */
    ["com.yunke.integration.readwise.desc"](): string;
    /**
      * `Connect`
      */
    ["com.yunke.integration.readwise.connect"](): string;
    /**
      * `Connect to Readwise`
      */
    ["com.yunke.integration.readwise.connect.title"](): string;
    /**
      * `Paste your access token here`
      */
    ["com.yunke.integration.readwise.connect.placeholder"](): string;
    /**
      * `Please enter a valid access token.`
      */
    ["com.yunke.integration.readwise.connect.input-error"](): string;
    /**
      * `Access Token failed validation`
      */
    ["com.yunke.integration.readwise.connect.error-notify-title"](): string;
    /**
      * `The token could not access Readwise. Please verify access and try again.`
      */
    ["com.yunke.integration.readwise.connect.error-notify-desc"](): string;
    /**
      * `Import`
      */
    ["com.yunke.integration.readwise.import"](): string;
    /**
      * `Disconnect`
      */
    ["com.yunke.integration.readwise.disconnect"](): string;
    /**
      * `Disconnect Readwise?`
      */
    ["com.yunke.integration.readwise.disconnect.title"](): string;
    /**
      * `Once disconnected, content will no longer be imported. Do you want to keep your existing highlights in YUNKE?`
      */
    ["com.yunke.integration.readwise.disconnect.desc"](): string;
    /**
      * `Keep`
      */
    ["com.yunke.integration.readwise.disconnect.keep"](): string;
    /**
      * `Delete`
      */
    ["com.yunke.integration.readwise.disconnect.delete"](): string;
    /**
      * `Highlights to be imported this time`
      */
    ["com.yunke.integration.readwise.import.title"](): string;
    /**
      * `Importing everything from the start`
      */
    ["com.yunke.integration.readwise.import.desc-from-start"](): string;
    /**
      * `Content`
      */
    ["com.yunke.integration.readwise.import.cell-h-content"](): string;
    /**
      * `Todo`
      */
    ["com.yunke.integration.readwise.import.cell-h-todo"](): string;
    /**
      * `Last update on Readwise`
      */
    ["com.yunke.integration.readwise.import.cell-h-time"](): string;
    /**
      * `New`
      */
    ["com.yunke.integration.readwise.import.todo-new"](): string;
    /**
      * `Skip`
      */
    ["com.yunke.integration.readwise.import.todo-skip"](): string;
    /**
      * `Updated`
      */
    ["com.yunke.integration.readwise.import.todo-update"](): string;
    /**
      * `No highlights needs to be imported`
      */
    ["com.yunke.integration.readwise.import.empty"](): string;
    /**
      * `Importing...`
      */
    ["com.yunke.integration.readwise.import.importing"](): string;
    /**
      * `Please keep this app active until it's finished`
      */
    ["com.yunke.integration.readwise.import.importing-desc"](): string;
    /**
      * `Stop Importing`
      */
    ["com.yunke.integration.readwise.import.importing-stop"](): string;
    /**
      * `Importing aborted`
      */
    ["com.yunke.integration.readwise.import.abort-notify-title"](): string;
    /**
      * `Import aborted, with {{finished}} highlights processed`
      */
    ["com.yunke.integration.readwise.import.abort-notify-desc"](options: {
        readonly finished: string;
    }): string;
    /**
      * `Configuration`
      */
    ["com.yunke.integration.readwise.setting.caption"](): string;
    /**
      * `New Readwise highlights will be imported to YUNKE `
      */
    ["com.yunke.integration.readwise.setting.sync-new-name"](): string;
    /**
      * `New highlights in Readwise will be synced to YUNKE `
      */
    ["com.yunke.integration.readwise.setting.sync-new-desc"](): string;
    /**
      * `Updates to Readwise highlights will be imported`
      */
    ["com.yunke.integration.readwise.setting.update-name"](): string;
    /**
      * `Enable this, so that we will process updates of existing highlights from Readwise `
      */
    ["com.yunke.integration.readwise.setting.update-desc"](): string;
    /**
      * `How do we handle updates`
      */
    ["com.yunke.integration.readwise.setting.update-strategy"](): string;
    /**
      * `Append new version to the end`
      */
    ["com.yunke.integration.readwise.setting.update-append-name"](): string;
    /**
      * `Cited or modified highlights will have future versions added to the end of them`
      */
    ["com.yunke.integration.readwise.setting.update-append-desc"](): string;
    /**
      * `Overwrite with new version`
      */
    ["com.yunke.integration.readwise.setting.update-override-name"](): string;
    /**
      * `Cited or modified highlights will be overwritten if there are future updates`
      */
    ["com.yunke.integration.readwise.setting.update-override-desc"](): string;
    /**
      * `Start Importing`
      */
    ["com.yunke.integration.readwise.setting.start-import-name"](): string;
    /**
      * `Using the settings above`
      */
    ["com.yunke.integration.readwise.setting.start-import-desc"](): string;
    /**
      * `Import`
      */
    ["com.yunke.integration.readwise.setting.start-import-button"](): string;
    /**
      * `Apply tags to highlight imports`
      */
    ["com.yunke.integration.readwise.setting.tags-label"](): string;
    /**
      * `Click to add tags`
      */
    ["com.yunke.integration.readwise.setting.tags-placeholder"](): string;
    /**
      * `Author`
      */
    ["com.yunke.integration.readwise-prop.author"](): string;
    /**
      * `Source`
      */
    ["com.yunke.integration.readwise-prop.source"](): string;
    /**
      * `Created`
      */
    ["com.yunke.integration.readwise-prop.created"](): string;
    /**
      * `Updated`
      */
    ["com.yunke.integration.readwise-prop.updated"](): string;
    /**
      * `Integration properties`
      */
    ["com.yunke.integration.properties"](): string;
    /**
      * `Calendar`
      */
    ["com.yunke.integration.calendar.name"](): string;
    /**
      * `New events will be scheduled in YUNKE’s journal`
      */
    ["com.yunke.integration.calendar.desc"](): string;
    /**
      * `Subscribe`
      */
    ["com.yunke.integration.calendar.new-subscription"](): string;
    /**
      * `Unsubscribe`
      */
    ["com.yunke.integration.calendar.unsubscribe"](): string;
    /**
      * `Add a calendar by URL`
      */
    ["com.yunke.integration.calendar.new-title"](): string;
    /**
      * `Calendar URL`
      */
    ["com.yunke.integration.calendar.new-url-label"](): string;
    /**
      * `This is a duplicate calendar`
      */
    ["com.yunke.integration.calendar.new-duplicate-error-title"](): string;
    /**
      * `This subscription calendar already exists in the account of subscribed calendars.`
      */
    ["com.yunke.integration.calendar.new-duplicate-error-content"](): string;
    /**
      * `An error occurred while adding the calendar`
      */
    ["com.yunke.integration.calendar.new-error"](): string;
    /**
      * `All day`
      */
    ["com.yunke.integration.calendar.all-day"](): string;
    /**
      * `New doc`
      */
    ["com.yunke.integration.calendar.new-doc"](): string;
    /**
      * `Show calendar events`
      */
    ["com.yunke.integration.calendar.show-events"](): string;
    /**
      * `Enabling this setting allows you to connect your calendar events to your Journal in YUNKE`
      */
    ["com.yunke.integration.calendar.show-events-desc"](): string;
    /**
      * `Show all day event`
      */
    ["com.yunke.integration.calendar.show-all-day-events"](): string;
    /**
      * `Are you sure you want to unsubscribe "{{name}}"? Unsubscribing this account will remove its data from Journal.`
      */
    ["com.yunke.integration.calendar.unsubscribe-content"](options: {
        readonly name: string;
    }): string;
    /**
      * `Notes`
      */
    ["com.yunke.audio.notes"](): string;
    /**
      * `Transcribing`
      */
    ["com.yunke.audio.transcribing"](): string;
    /**
      * `Unable to retrieve AI results for others`
      */
    ["com.yunke.audio.transcribe.non-owner.confirm.title"](): string;
    /**
      * `Audio activity`
      */
    ["com.yunke.recording.new"](): string;
    /**
      * `Finished`
      */
    ["com.yunke.recording.success.prompt"](): string;
    /**
      * `Open app`
      */
    ["com.yunke.recording.success.button"](): string;
    /**
      * `Failed to save`
      */
    ["com.yunke.recording.failed.prompt"](): string;
    /**
      * `Open file`
      */
    ["com.yunke.recording.failed.button"](): string;
    /**
      * `{{appName}}'s audio`
      */
    ["com.yunke.recording.recording"](options: {
        readonly appName: string;
    }): string;
    /**
      * `Audio recording`
      */
    ["com.yunke.recording.recording.unnamed"](): string;
    /**
      * `Start`
      */
    ["com.yunke.recording.start"](): string;
    /**
      * `Dismiss`
      */
    ["com.yunke.recording.dismiss"](): string;
    /**
      * `Stop`
      */
    ["com.yunke.recording.stop"](): string;
    /**
      * `Migrate Data to Enhance User Experience`
      */
    ["com.yunke.migration-all-docs-notification.header"](): string;
    /**
      * `We are updating the local data to facilitate the recording and filtering of created by and Last edited by information. Please click the “Migrate Data” button and ensure a stable network connection during the process.`
      */
    ["com.yunke.migration-all-docs-notification.desc"](): string;
    /**
      * `Migration failed: {{errorMessage}}`
      */
    ["com.yunke.migration-all-docs-notification.error"](options: {
        readonly errorMessage: string;
    }): string;
    /**
      * `Migrate data`
      */
    ["com.yunke.migration-all-docs-notification.button"](): string;
    /**
      * `An internal error occurred.`
      */
    ["error.INTERNAL_SERVER_ERROR"](): string;
    /**
      * `Network error.`
      */
    ["error.NETWORK_ERROR"](): string;
    /**
      * `Too many requests.`
      */
    ["error.TOO_MANY_REQUEST"](): string;
    /**
      * `Resource not found.`
      */
    ["error.NOT_FOUND"](): string;
    /**
      * `Bad request.`
      */
    ["error.BAD_REQUEST"](): string;
    /**
      * `GraphQL bad request, code: {{code}}, {{message}}`
      */
    ["error.GRAPHQL_BAD_REQUEST"](options: Readonly<{
        code: string;
        message: string;
    }>): string;
    /**
      * `HTTP request error, message: {{message}}`
      */
    ["error.HTTP_REQUEST_ERROR"](options: {
        readonly message: string;
    }): string;
    /**
      * `Email service is not configured.`
      */
    ["error.EMAIL_SERVICE_NOT_CONFIGURED"](): string;
    /**
      * `Query is too long, max length is {{max}}.`
      */
    ["error.QUERY_TOO_LONG"](options: {
        readonly max: string;
    }): string;
    /**
      * `Validation error, errors: {{errors}}`
      */
    ["error.VALIDATION_ERROR"](options: {
        readonly errors: string;
    }): string;
    /**
      * `User not found.`
      */
    ["error.USER_NOT_FOUND"](): string;
    /**
      * `User avatar not found.`
      */
    ["error.USER_AVATAR_NOT_FOUND"](): string;
    /**
      * `This email has already been registered.`
      */
    ["error.EMAIL_ALREADY_USED"](): string;
    /**
      * `You are trying to update your account email to the same as the old one.`
      */
    ["error.SAME_EMAIL_PROVIDED"](): string;
    /**
      * `Wrong user email or password: {{email}}`
      */
    ["error.WRONG_SIGN_IN_CREDENTIALS"](options: {
        readonly email: string;
    }): string;
    /**
      * `Unknown authentication provider {{name}}.`
      */
    ["error.UNKNOWN_OAUTH_PROVIDER"](options: {
        readonly name: string;
    }): string;
    /**
      * `OAuth state expired, please try again.`
      */
    ["error.OAUTH_STATE_EXPIRED"](): string;
    /**
      * `Invalid callback state parameter.`
      */
    ["error.INVALID_OAUTH_CALLBACK_STATE"](): string;
    /**
      * `Invalid callback code parameter, provider response status: {{status}} and body: {{body}}.`
      */
    ["error.INVALID_OAUTH_CALLBACK_CODE"](options: Readonly<{
        status: string;
        body: string;
    }>): string;
    /**
      * `Invalid auth state. You might start the auth progress from another device.`
      */
    ["error.INVALID_AUTH_STATE"](): string;
    /**
      * `Missing query parameter `{{name}}`.`
      */
    ["error.MISSING_OAUTH_QUERY_PARAMETER"](options: {
        readonly name: string;
    }): string;
    /**
      * `The third-party account has already been connected to another user.`
      */
    ["error.OAUTH_ACCOUNT_ALREADY_CONNECTED"](): string;
    /**
      * `Invalid OAuth response: {{reason}}.`
      */
    ["error.INVALID_OAUTH_RESPONSE"](options: {
        readonly reason: string;
    }): string;
    /**
      * `An invalid email provided: {{email}}`
      */
    ["error.INVALID_EMAIL"](options: {
        readonly email: string;
    }): string;
    /**
      * `Password must be between {{min}} and {{max}} characters`
      */
    ["error.INVALID_PASSWORD_LENGTH"](options: Readonly<{
        min: string;
        max: string;
    }>): string;
    /**
      * `Password is required.`
      */
    ["error.PASSWORD_REQUIRED"](): string;
    /**
      * `You are trying to sign in by a different method than you signed up with.`
      */
    ["error.WRONG_SIGN_IN_METHOD"](): string;
    /**
      * `You don't have early access permission. Visit https://community.yunke.pro/c/insider-general/ for more information.`
      */
    ["error.EARLY_ACCESS_REQUIRED"](): string;
    /**
      * `You are not allowed to sign up.`
      */
    ["error.SIGN_UP_FORBIDDEN"](): string;
    /**
      * `The email token provided is not found.`
      */
    ["error.EMAIL_TOKEN_NOT_FOUND"](): string;
    /**
      * `An invalid email token provided.`
      */
    ["error.INVALID_EMAIL_TOKEN"](): string;
    /**
      * `The link has expired.`
      */
    ["error.LINK_EXPIRED"](): string;
    /**
      * `You must sign in first to access this resource.`
      */
    ["error.AUTHENTICATION_REQUIRED"](): string;
    /**
      * `You are not allowed to perform this action.`
      */
    ["error.ACTION_FORBIDDEN"](): string;
    /**
      * `You do not have permission to access this resource.`
      */
    ["error.ACCESS_DENIED"](): string;
    /**
      * `You must verify your email before accessing this resource.`
      */
    ["error.EMAIL_VERIFICATION_REQUIRED"](): string;
    /**
      * `Space {{spaceId}} permission not found.`
      */
    ["error.WORKSPACE_PERMISSION_NOT_FOUND"](options: {
        readonly spaceId: string;
    }): string;
    /**
      * `Space {{spaceId}} not found.`
      */
    ["error.SPACE_NOT_FOUND"](options: {
        readonly spaceId: string;
    }): string;
    /**
      * `Member not found in Space {{spaceId}}.`
      */
    ["error.MEMBER_NOT_FOUND_IN_SPACE"](options: {
        readonly spaceId: string;
    }): string;
    /**
      * `You should join in Space {{spaceId}} before broadcasting messages.`
      */
    ["error.NOT_IN_SPACE"](options: {
        readonly spaceId: string;
    }): string;
    /**
      * `You have already joined in Space {{spaceId}}.`
      */
    ["error.ALREADY_IN_SPACE"](options: {
        readonly spaceId: string;
    }): string;
    /**
      * `You do not have permission to access Space {{spaceId}}.`
      */
    ["error.SPACE_ACCESS_DENIED"](options: {
        readonly spaceId: string;
    }): string;
    /**
      * `Owner of Space {{spaceId}} not found.`
      */
    ["error.SPACE_OWNER_NOT_FOUND"](options: {
        readonly spaceId: string;
    }): string;
    /**
      * `Space should have only one owner.`
      */
    ["error.SPACE_SHOULD_HAVE_ONLY_ONE_OWNER"](): string;
    /**
      * `Owner can not leave the workspace.`
      */
    ["error.OWNER_CAN_NOT_LEAVE_WORKSPACE"](): string;
    /**
      * `You can not revoke your own permission.`
      */
    ["error.CAN_NOT_REVOKE_YOURSELF"](): string;
    /**
      * `Doc {{docId}} under Space {{spaceId}} not found.`
      */
    ["error.DOC_NOT_FOUND"](options: Readonly<{
        docId: string;
        spaceId: string;
    }>): string;
    /**
      * `You do not have permission to perform {{action}} action on doc {{docId}}.`
      */
    ["error.DOC_ACTION_DENIED"](options: Readonly<{
        action: string;
        docId: string;
    }>): string;
    /**
      * `Doc {{docId}} under Space {{spaceId}} is blocked from updating.`
      */
    ["error.DOC_UPDATE_BLOCKED"](options: Readonly<{
        docId: string;
        spaceId: string;
    }>): string;
    /**
      * `Your client with version {{version}} is rejected by remote sync server. Please upgrade to {{serverVersion}}.`
      */
    ["error.VERSION_REJECTED"](options: Readonly<{
        version: string;
        serverVersion: string;
    }>): string;
    /**
      * `Invalid doc history timestamp provided.`
      */
    ["error.INVALID_HISTORY_TIMESTAMP"](): string;
    /**
      * `History of {{docId}} at {{timestamp}} under Space {{spaceId}}.`
      */
    ["error.DOC_HISTORY_NOT_FOUND"](options: Readonly<{
        docId: string;
        timestamp: string;
        spaceId: string;
    }>): string;
    /**
      * `Blob {{blobId}} not found in Space {{spaceId}}.`
      */
    ["error.BLOB_NOT_FOUND"](options: Readonly<{
        blobId: string;
        spaceId: string;
    }>): string;
    /**
      * `Expected to publish a doc, not a Space.`
      */
    ["error.EXPECT_TO_PUBLISH_DOC"](): string;
    /**
      * `Expected to revoke a public doc, not a Space.`
      */
    ["error.EXPECT_TO_REVOKE_PUBLIC_DOC"](): string;
    /**
      * `Expect grant roles on doc {{docId}} under Space {{spaceId}}, not a Space.`
      */
    ["error.EXPECT_TO_GRANT_DOC_USER_ROLES"](options: Readonly<{
        docId: string;
        spaceId: string;
    }>): string;
    /**
      * `Expect revoke roles on doc {{docId}} under Space {{spaceId}}, not a Space.`
      */
    ["error.EXPECT_TO_REVOKE_DOC_USER_ROLES"](options: Readonly<{
        docId: string;
        spaceId: string;
    }>): string;
    /**
      * `Expect update roles on doc {{docId}} under Space {{spaceId}}, not a Space.`
      */
    ["error.EXPECT_TO_UPDATE_DOC_USER_ROLE"](options: Readonly<{
        docId: string;
        spaceId: string;
    }>): string;
    /**
      * `Doc is not public.`
      */
    ["error.DOC_IS_NOT_PUBLIC"](): string;
    /**
      * `Failed to store doc updates.`
      */
    ["error.FAILED_TO_SAVE_UPDATES"](): string;
    /**
      * `Failed to store doc snapshot.`
      */
    ["error.FAILED_TO_UPSERT_SNAPSHOT"](): string;
    /**
      * `A Team workspace is required to perform this action.`
      */
    ["error.ACTION_FORBIDDEN_ON_NON_TEAM_WORKSPACE"](): string;
    /**
      * `Doc default role can not be owner.`
      */
    ["error.DOC_DEFAULT_ROLE_CAN_NOT_BE_OWNER"](): string;
    /**
      * `Can not batch grant doc owner permissions.`
      */
    ["error.CAN_NOT_BATCH_GRANT_DOC_OWNER_PERMISSIONS"](): string;
    /**
      * `Can not set a non-active member as owner.`
      */
    ["error.NEW_OWNER_IS_NOT_ACTIVE_MEMBER"](): string;
    /**
      * `Invalid invitation provided.`
      */
    ["error.INVALID_INVITATION"](): string;
    /**
      * `No more seat available in the Space {{spaceId}}.`
      */
    ["error.NO_MORE_SEAT"](options: {
        readonly spaceId: string;
    }): string;
    /**
      * `Unsupported subscription plan: {{plan}}.`
      */
    ["error.UNSUPPORTED_SUBSCRIPTION_PLAN"](options: {
        readonly plan: string;
    }): string;
    /**
      * `Failed to create checkout session.`
      */
    ["error.FAILED_TO_CHECKOUT"](): string;
    /**
      * `Invalid checkout parameters provided.`
      */
    ["error.INVALID_CHECKOUT_PARAMETERS"](): string;
    /**
      * `You have already subscribed to the {{plan}} plan.`
      */
    ["error.SUBSCRIPTION_ALREADY_EXISTS"](options: {
        readonly plan: string;
    }): string;
    /**
      * `Invalid subscription parameters provided.`
      */
    ["error.INVALID_SUBSCRIPTION_PARAMETERS"](): string;
    /**
      * `You didn't subscribe to the {{plan}} plan.`
      */
    ["error.SUBSCRIPTION_NOT_EXISTS"](options: {
        readonly plan: string;
    }): string;
    /**
      * `Your subscription has already been canceled.`
      */
    ["error.SUBSCRIPTION_HAS_BEEN_CANCELED"](): string;
    /**
      * `Your subscription has not been canceled.`
      */
    ["error.SUBSCRIPTION_HAS_NOT_BEEN_CANCELED"](): string;
    /**
      * `Your subscription has expired.`
      */
    ["error.SUBSCRIPTION_EXPIRED"](): string;
    /**
      * `Your subscription has already been in {{recurring}} recurring state.`
      */
    ["error.SAME_SUBSCRIPTION_RECURRING"](options: {
        readonly recurring: string;
    }): string;
    /**
      * `Failed to create customer portal session.`
      */
    ["error.CUSTOMER_PORTAL_CREATE_FAILED"](): string;
    /**
      * `You are trying to access a unknown subscription plan.`
      */
    ["error.SUBSCRIPTION_PLAN_NOT_FOUND"](): string;
    /**
      * `You cannot update an onetime payment subscription.`
      */
    ["error.CANT_UPDATE_ONETIME_PAYMENT_SUBSCRIPTION"](): string;
    /**
      * `A workspace is required to checkout for team subscription.`
      */
    ["error.WORKSPACE_ID_REQUIRED_FOR_TEAM_SUBSCRIPTION"](): string;
    /**
      * `Workspace id is required to update team subscription.`
      */
    ["error.WORKSPACE_ID_REQUIRED_TO_UPDATE_TEAM_SUBSCRIPTION"](): string;
    /**
      * `Copilot session not found.`
      */
    ["error.COPILOT_SESSION_NOT_FOUND"](): string;
    /**
      * `Copilot session has been deleted.`
      */
    ["error.COPILOT_SESSION_DELETED"](): string;
    /**
      * `No copilot provider available.`
      */
    ["error.NO_COPILOT_PROVIDER_AVAILABLE"](): string;
    /**
      * `Failed to generate text.`
      */
    ["error.COPILOT_FAILED_TO_GENERATE_TEXT"](): string;
    /**
      * `Failed to create chat message.`
      */
    ["error.COPILOT_FAILED_TO_CREATE_MESSAGE"](): string;
    /**
      * `Unsplash is not configured.`
      */
    ["error.UNSPLASH_IS_NOT_CONFIGURED"](): string;
    /**
      * `Action has been taken, no more messages allowed.`
      */
    ["error.COPILOT_ACTION_TAKEN"](): string;
    /**
      * `Doc {{docId}} not found.`
      */
    ["error.COPILOT_DOC_NOT_FOUND"](options: {
        readonly docId: string;
    }): string;
    /**
      * `Some docs not found.`
      */
    ["error.COPILOT_DOCS_NOT_FOUND"](): string;
    /**
      * `Copilot message {{messageId}} not found.`
      */
    ["error.COPILOT_MESSAGE_NOT_FOUND"](options: {
        readonly messageId: string;
    }): string;
    /**
      * `Copilot prompt {{name}} not found.`
      */
    ["error.COPILOT_PROMPT_NOT_FOUND"](options: {
        readonly name: string;
    }): string;
    /**
      * `Copilot prompt is invalid.`
      */
    ["error.COPILOT_PROMPT_INVALID"](): string;
    /**
      * `Copilot provider {{provider}} does not support output type {{kind}}`
      */
    ["error.COPILOT_PROVIDER_NOT_SUPPORTED"](options: Readonly<{
        provider: string;
        kind: string;
    }>): string;
    /**
      * `Provider {{provider}} failed with {{kind}} error: {{message}}`
      */
    ["error.COPILOT_PROVIDER_SIDE_ERROR"](options: Readonly<{
        provider: string;
        kind: string;
        message: string;
    }>): string;
    /**
      * `Invalid copilot context {{contextId}}.`
      */
    ["error.COPILOT_INVALID_CONTEXT"](options: {
        readonly contextId: string;
    }): string;
    /**
      * `File {{fileName}} is not supported to use as context: {{message}}`
      */
    ["error.COPILOT_CONTEXT_FILE_NOT_SUPPORTED"](options: Readonly<{
        fileName: string;
        message: string;
    }>): string;
    /**
      * `Failed to modify context {{contextId}}: {{message}}`
      */
    ["error.COPILOT_FAILED_TO_MODIFY_CONTEXT"](options: Readonly<{
        contextId: string;
        message: string;
    }>): string;
    /**
      * `Failed to match context {{contextId}} with "%7B%7Bcontent%7D%7D": {{message}}`
      */
    ["error.COPILOT_FAILED_TO_MATCH_CONTEXT"](options: Readonly<{
        contextId: string;
        message: string;
    }>): string;
    /**
      * `Failed to match context in workspace {{workspaceId}} with "%7B%7Bcontent%7D%7D": {{message}}`
      */
    ["error.COPILOT_FAILED_TO_MATCH_GLOBAL_CONTEXT"](options: Readonly<{
        workspaceId: string;
        message: string;
    }>): string;
    /**
      * `Embedding feature is disabled, please contact the administrator to enable it in the workspace settings.`
      */
    ["error.COPILOT_EMBEDDING_DISABLED"](): string;
    /**
      * `Embedding feature not available, you may need to install pgvector extension to your database`
      */
    ["error.COPILOT_EMBEDDING_UNAVAILABLE"](): string;
    /**
      * `Transcription job already exists`
      */
    ["error.COPILOT_TRANSCRIPTION_JOB_EXISTS"](): string;
    /**
      * `Transcription job not found.`
      */
    ["error.COPILOT_TRANSCRIPTION_JOB_NOT_FOUND"](): string;
    /**
      * `Audio not provided.`
      */
    ["error.COPILOT_TRANSCRIPTION_AUDIO_NOT_PROVIDED"](): string;
    /**
      * `Failed to add workspace file embedding: {{message}}`
      */
    ["error.COPILOT_FAILED_TO_ADD_WORKSPACE_FILE_EMBEDDING"](options: {
        readonly message: string;
    }): string;
    /**
      * `You have exceeded your blob size quota.`
      */
    ["error.BLOB_QUOTA_EXCEEDED"](): string;
    /**
      * `You have exceeded your storage quota.`
      */
    ["error.STORAGE_QUOTA_EXCEEDED"](): string;
    /**
      * `You have exceeded your workspace member quota.`
      */
    ["error.MEMBER_QUOTA_EXCEEDED"](): string;
    /**
      * `You have reached the limit of actions in this workspace, please upgrade your plan.`
      */
    ["error.COPILOT_QUOTA_EXCEEDED"](): string;
    /**
      * `Runtime config {{key}} not found.`
      */
    ["error.RUNTIME_CONFIG_NOT_FOUND"](options: {
        readonly key: string;
    }): string;
    /**
      * `Invalid runtime config type  for '{{key}}', want '{{want}}', but get {{get}}.`
      */
    ["error.INVALID_RUNTIME_CONFIG_TYPE"](options: Readonly<{
        key: string;
        want: string;
        get: string;
    }>): string;
    /**
      * `Mailer service is not configured.`
      */
    ["error.MAILER_SERVICE_IS_NOT_CONFIGURED"](): string;
    /**
      * `Cannot delete all admin accounts.`
      */
    ["error.CANNOT_DELETE_ALL_ADMIN_ACCOUNT"](): string;
    /**
      * `Cannot delete own account.`
      */
    ["error.CANNOT_DELETE_OWN_ACCOUNT"](): string;
    /**
      * `Cannot delete account. You are the owner of one or more team workspaces. Please transfer ownership or delete them first.`
      */
    ["error.CANNOT_DELETE_ACCOUNT_WITH_OWNED_TEAM_WORKSPACE"](): string;
    /**
      * `Captcha verification failed.`
      */
    ["error.CAPTCHA_VERIFICATION_FAILED"](): string;
    /**
      * `Invalid session id to generate license key.`
      */
    ["error.INVALID_LICENSE_SESSION_ID"](): string;
    /**
      * `License key has been revealed. Please check your mail box of the one provided during checkout.`
      */
    ["error.LICENSE_REVEALED"](): string;
    /**
      * `Workspace already has a license applied.`
      */
    ["error.WORKSPACE_LICENSE_ALREADY_EXISTS"](): string;
    /**
      * `License not found.`
      */
    ["error.LICENSE_NOT_FOUND"](): string;
    /**
      * `Invalid license to activate. {{reason}}`
      */
    ["error.INVALID_LICENSE_TO_ACTIVATE"](options: {
        readonly reason: string;
    }): string;
    /**
      * `Invalid license update params. {{reason}}`
      */
    ["error.INVALID_LICENSE_UPDATE_PARAMS"](options: {
        readonly reason: string;
    }): string;
    /**
      * `License has expired.`
      */
    ["error.LICENSE_EXPIRED"](): string;
    /**
      * `Unsupported client with version [{{clientVersion}}], required version is [{{requiredVersion}}].`
      */
    ["error.UNSUPPORTED_CLIENT_VERSION"](options: Readonly<{
        clientVersion: string;
        requiredVersion: string;
    }>): string;
    /**
      * `Notification not found.`
      */
    ["error.NOTIFICATION_NOT_FOUND"](): string;
    /**
      * `Mentioned user can not access doc {{docId}}.`
      */
    ["error.MENTION_USER_DOC_ACCESS_DENIED"](options: {
        readonly docId: string;
    }): string;
    /**
      * `You can not mention yourself.`
      */
    ["error.MENTION_USER_ONESELF_DENIED"](): string;
    /**
      * `Invalid app config for module `{{module}}` with key `{{key}}`. {{hint}}.`
      */
    ["error.INVALID_APP_CONFIG"](options: Readonly<{
        module: string;
        key: string;
        hint: string;
    }>): string;
    /**
      * `Invalid app config input: {{message}}`
      */
    ["error.INVALID_APP_CONFIG_INPUT"](options: {
        readonly message: string;
    }): string;
    /**
      * `Search provider not found.`
      */
    ["error.SEARCH_PROVIDER_NOT_FOUND"](): string;
    /**
      * `Invalid request argument to search provider: {{reason}}`
      */
    ["error.INVALID_SEARCH_PROVIDER_REQUEST"](options: {
        readonly reason: string;
    }): string;
    /**
      * `Invalid indexer input: {{reason}}`
      */
    ["error.INVALID_INDEXER_INPUT"](options: {
        readonly reason: string;
    }): string;
} { const { t } = useTranslation(); return useMemo(() => createProxy((key) => t.bind(null, key)), [t]); }
function createComponent(i18nKey: string) {
    return (props) => createElement(Trans, { i18nKey, shouldUnescape: true, ...props });
}
export const TypedTrans: {
    /**
      * `Go to <a>{{link}}</a> for learn more details about YUNKE AI.`
      */
    ["com.yunke.ai-onboarding.general.5.description"]: ComponentType<TypedTransProps<{
        readonly link: string;
    }, {
        a: JSX.Element;
    }>>;
    /**
      * `By continuing, you are agreeing to our <a>AI Terms</a>.`
      */
    ["com.yunke.ai-onboarding.general.privacy"]: ComponentType<TypedTransProps<Readonly<{}>, {
        a: JSX.Element;
    }>>;
    /**
      * `Opening <1>YUNKE</1> app now`
      */
    ["com.yunke.auth.open.yunke.prompt"]: ComponentType<TypedTransProps<Readonly<{}>, {
        ["1"]: JSX.Element;
    }>>;
    /**
      * `This doc is now opened in <1>YUNKE</1> app`
      */
    ["com.yunke.auth.open.yunke.open-doc-prompt"]: ComponentType<TypedTransProps<Readonly<{}>, {
        ["1"]: JSX.Element;
    }>>;
    /**
      * `To continue signing in, please enter the code that was sent to <a>{{email}}</a>.`
      */
    ["com.yunke.auth.sign.auth.code.hint"]: ComponentType<TypedTransProps<{
        readonly email: string;
    }, {
        a: JSX.Element;
    }>>;
    /**
      * `Or <1>sign in with password</1> instead.`
      */
    ["com.yunke.auth.sign.auth.code.message.password"]: ComponentType<TypedTransProps<Readonly<{}>, {
        ["1"]: JSX.Element;
    }>>;
    /**
      * `The Self-Hosted instance is not hosted or deployed by YUNKE. Your data will be stored on these instances.  <1>Learn more about Self-Host details.</1>`
      */
    ["com.yunke.auth.sign.add-selfhosted.description"]: ComponentType<TypedTransProps<Readonly<{}>, {
        ["1"]: JSX.Element;
    }>>;
    /**
      * `By clicking “Continue with Google/Email” above, you acknowledge that you agree to YUNKE's <1>Terms of Conditions</1> and <3>Privacy Policy</3>.`
      */
    ["com.yunke.auth.sign.message"]: ComponentType<TypedTransProps<Readonly<{}>, {
        ["1"]: JSX.Element;
        ["3"]: JSX.Element;
    }>>;
    /**
      * `This demo is limited. <1>Download the YUNKE Client</1> for the latest features and Performance.`
      */
    ["com.yunke.banner.content"]: ComponentType<TypedTransProps<Readonly<{}>, {
        ["1"]: JSX.Element;
    }>>;
    /**
      * `<0>{{count}}</0> selected`
    
      * - com.yunke.collection.toolbar.selected_one: `<0>{{count}}</0> collection selected`
    
      * - com.yunke.collection.toolbar.selected_other: `<0>{{count}}</0> collection(s) selected`
      */
    ["com.yunke.collection.toolbar.selected"]: ComponentType<TypedTransProps<{
        readonly count: string | number | bigint;
    }, {
        ["0"]: JSX.Element;
    }>>;
    /**
      * `<0>{{count}}</0> collection selected`
      */
    ["com.yunke.collection.toolbar.selected_one"]: ComponentType<TypedTransProps<{
        readonly count: string | number | bigint;
    }, {
        ["0"]: JSX.Element;
    }>>;
    /**
      * `<0>{{count}}</0> collection(s) selected`
      */
    ["com.yunke.collection.toolbar.selected_other"]: ComponentType<TypedTransProps<{
        readonly count: string | number | bigint;
    }, {
        ["0"]: JSX.Element;
    }>>;
    /**
      * `<0>{{count}}</0> collection(s) selected`
      */
    ["com.yunke.collection.toolbar.selected_others"]: ComponentType<TypedTransProps<{
        readonly count: string;
    }, {
        ["0"]: JSX.Element;
    }>>;
    /**
      * `Deleting <1>{{tag}}</1> cannot be undone, please proceed with caution.`
      */
    ["com.yunke.delete-tags.confirm.description"]: ComponentType<TypedTransProps<{
        readonly tag: string;
    }, {
        ["1"]: JSX.Element;
    }>>;
    /**
      * `Selected <1>{{selectedCount}}</1>, filtered <3>{{filteredCount}}</3>`
      */
    ["com.yunke.editCollection.rules.countTips"]: ComponentType<TypedTransProps<Readonly<{
        selectedCount: string;
        filteredCount: string;
    }>, {
        ["1"]: JSX.Element;
        ["3"]: JSX.Element;
    }>>;
    /**
      * `Showing <1>{{count}}</1> docs.`
      */
    ["com.yunke.editCollection.rules.countTips.more"]: ComponentType<TypedTransProps<{
        readonly count: string;
    }, {
        ["1"]: JSX.Element;
    }>>;
    /**
      * `Showing <1>{{count}}</1> doc.`
      */
    ["com.yunke.editCollection.rules.countTips.one"]: ComponentType<TypedTransProps<{
        readonly count: string;
    }, {
        ["1"]: JSX.Element;
    }>>;
    /**
      * `Showing <1>{{count}}</1> docs.`
      */
    ["com.yunke.editCollection.rules.countTips.zero"]: ComponentType<TypedTransProps<{
        readonly count: string;
    }, {
        ["1"]: JSX.Element;
    }>>;
    /**
      * `Please <1>add rules</1> to save this collection or switch to <3>Docs</3>, use manual selection mode`
      */
    ["com.yunke.editCollection.rules.empty.noRules.tips"]: ComponentType<TypedTransProps<Readonly<{}>, {
        ["1"]: JSX.Element;
        ["3"]: JSX.Element;
    }>>;
    /**
      * `Docs that meet the rules will be added to the current collection <2>{{highlight}}</2>`
      */
    ["com.yunke.editCollection.rules.tips"]: ComponentType<TypedTransProps<{
        readonly highlight: string;
    }, {
        ["2"]: JSX.Element;
    }>>;
    /**
      * `If you are still experiencing this issue, please <1>contact us through the community</1>.`
      */
    ["com.yunke.error.contact-us"]: ComponentType<TypedTransProps<Readonly<{}>, {
        ["1"]: JSX.Element;
    }>>;
    /**
      * `With the workspace creator's free account, every member can access up to <1>7 days<1> of version history.`
      */
    ["com.yunke.history.confirm-restore-modal.free-plan-prompt.description"]: ComponentType<TypedTransProps<Readonly<{}>, {
        ["1"]: JSX.Element;
    }>>;
    /**
      * `With the workspace creator's Pro account, every member enjoys the privilege of accessing up to <1>30 days<1> of version history.`
      */
    ["com.yunke.history.confirm-restore-modal.pro-plan-prompt.description"]: ComponentType<TypedTransProps<Readonly<{}>, {
        ["1"]: JSX.Element;
    }>>;
    /**
      * `<0>{{count}}</0> selected`
    
      * - com.yunke.page.toolbar.selected_one: `<0>{{count}}</0> doc selected`
    
      * - com.yunke.page.toolbar.selected_other: `<0>{{count}}</0> doc(s) selected`
      */
    ["com.yunke.page.toolbar.selected"]: ComponentType<TypedTransProps<{
        readonly count: string | number | bigint;
    }, {
        ["0"]: JSX.Element;
    }>>;
    /**
      * `<0>{{count}}</0> doc selected`
      */
    ["com.yunke.page.toolbar.selected_one"]: ComponentType<TypedTransProps<{
        readonly count: string | number | bigint;
    }, {
        ["0"]: JSX.Element;
    }>>;
    /**
      * `<0>{{count}}</0> doc(s) selected`
      */
    ["com.yunke.page.toolbar.selected_other"]: ComponentType<TypedTransProps<{
        readonly count: string | number | bigint;
    }, {
        ["0"]: JSX.Element;
    }>>;
    /**
      * `<0>{{count}}</0> doc(s) selected`
      */
    ["com.yunke.page.toolbar.selected_others"]: ComponentType<TypedTransProps<{
        readonly count: string;
    }, {
        ["0"]: JSX.Element;
    }>>;
    /**
      * `You are currently on the <a>free plan</a>.`
      */
    ["com.yunke.payment.billing-setting.ai.free-desc"]: ComponentType<TypedTransProps<Readonly<{}>, {
        a: JSX.Element;
    }>>;
    /**
      * `You have purchased <a>Believer plan</a>. Enjoy with your benefits!`
      */
    ["com.yunke.payment.billing-setting.believer.description"]: ComponentType<TypedTransProps<Readonly<{}>, {
        a: JSX.Element;
    }>>;
    /**
      * `You are currently on the <1>{{planName}} plan</1>.`
      */
    ["com.yunke.payment.billing-setting.current-plan.description"]: ComponentType<TypedTransProps<{
        readonly planName: string;
    }, {
        ["1"]: JSX.Element;
    }>>;
    /**
      * `You are currently on the believer <1>{{planName}} plan</1>.`
      */
    ["com.yunke.payment.billing-setting.current-plan.description.lifetime"]: ComponentType<TypedTransProps<{
        readonly planName: string;
    }, {
        ["1"]: JSX.Element;
    }>>;
    /**
      * `You are currently on the monthly <1>{{planName}} plan</1>.`
      */
    ["com.yunke.payment.billing-setting.current-plan.description.monthly"]: ComponentType<TypedTransProps<{
        readonly planName: string;
    }, {
        ["1"]: JSX.Element;
    }>>;
    /**
      * `You are currently on the annually <1>{{planName}} plan</1>.`
      */
    ["com.yunke.payment.billing-setting.current-plan.description.yearly"]: ComponentType<TypedTransProps<{
        readonly planName: string;
    }, {
        ["1"]: JSX.Element;
    }>>;
    /**
      * `One-time Purchase. Personal use rights for up to 150 years. <a>Fair Usage Policies</a> may apply.`
      */
    ["com.yunke.payment.lifetime.caption-2"]: ComponentType<TypedTransProps<Readonly<{}>, {
        a: JSX.Element;
    }>>;
    /**
      * `You are currently on the {{currentPlan}} plan. If you have any questions, please contact our <3>customer support</3>.`
      */
    ["com.yunke.payment.subtitle-active"]: ComponentType<TypedTransProps<{
        readonly currentPlan: string;
    }, {
        ["3"]: JSX.Element;
    }>>;
    /**
      * `If you have any questions, please contact our <1> customer support</1>.`
      */
    ["com.yunke.payment.upgrade-success-page.support"]: ComponentType<TypedTransProps<Readonly<{}>, {
        ["1"]: JSX.Element;
    }>>;
    /**
      * `If you have any questions, please contact our <1>customer support</1>.`
      */
    ["com.yunke.payment.upgrade-success-page.team.text-2"]: ComponentType<TypedTransProps<Readonly<{}>, {
        ["1"]: JSX.Element;
    }>>;
    /**
      * `If you have any questions, please contact our <1>customer support</1>.`
      */
    ["com.yunke.payment.license-success.text-2"]: ComponentType<TypedTransProps<Readonly<{}>, {
        ["1"]: JSX.Element;
    }>>;
    /**
      * `This action deletes the old Favorites section. <b>Your documents are safe</b>, ensure you've moved your frequently accessed documents to the new personal Favorites section.`
      */
    ["com.yunke.rootAppSidebar.migration-data.clean-all.description"]: ComponentType<TypedTransProps<Readonly<{}>, {
        b: JSX.Element;
    }>>;
    /**
      * `<b>Your documents are safe</b>, but you'll need to re-pin your most-used ones. "Favorites" are now personal. Move items from the old shared section to your new personal section or remove the old one by clicking "Empty the old favorites" now.`
      */
    ["com.yunke.rootAppSidebar.migration-data.help.description"]: ComponentType<TypedTransProps<Readonly<{}>, {
        b: JSX.Element;
    }>>;
    /**
      * `No doc titles contain <1>{{search}}</1>`
      */
    ["com.yunke.selectPage.empty.tips"]: ComponentType<TypedTransProps<{
        readonly search: string;
    }, {
        ["1"]: JSX.Element;
    }>>;
    /**
      * `Your account will be inaccessible, and your personal cloud space will be permanently deleted. You can remove local data by uninstalling the app or clearing your browser storage. <1>This action is irreversible.</1>`
      */
    ["com.yunke.setting.account.delete.confirm-description-2"]: ComponentType<TypedTransProps<Readonly<{}>, {
        ["1"]: JSX.Element;
    }>>;
    /**
      * `Don't have the app? <1>Click to download</1>.`
      */
    ["com.yunke.open-in-app.card.subtitle"]: ComponentType<TypedTransProps<Readonly<{}>, {
        ["1"]: JSX.Element;
    }>>;
    /**
      * `Settings changed; please restart the app. <1>Restart</1>`
      */
    ["com.yunke.settings.editorSettings.general.spell-check.restart-hint"]: ComponentType<TypedTransProps<Readonly<{}>, {
        ["1"]: JSX.Element;
    }>>;
    /**
      * `Love our app? <1>Star us on GitHub</1> and <2>create issues</2> for your valuable feedback!`
      */
    ["com.yunke.settings.suggestion-2"]: ComponentType<TypedTransProps<Readonly<{}>, {
        ["1"]: JSX.Element;
        ["2"]: JSX.Element;
    }>>;
    /**
      * `Meeting Features Available <strong>Free</strong> in Beta Phase`
      */
    ["com.yunke.settings.meetings.setting.prompt.2"]: ComponentType<TypedTransProps<Readonly<{}>, {
        strong: JSX.Element;
    }>>;
    /**
      * `<strong>Where AI meets your meetings - yunke your collaboration.</strong>
    <ul><li>Extract Action Items & Key Insights Instantly</li><li>Smart Auto-Capture Starts With Your Meeting</li><li>Seamless Integration Across All Meeting Platforms</li><li>One Unified Space for All Your Meeting's Context</li><li>Your AI Assistant with Every Meeting Context Preserved</li></ul>`
      */
    ["com.yunke.settings.meetings.setting.welcome.hints"]: ComponentType<TypedTransProps<Readonly<{}>, {
        strong: JSX.Element;
        ul: JSX.Element;
        li: JSX.Element;
    }>>;
    /**
      * `Utilize the meeting notes and AI summarization features provided by YUNKE. <1>Discuss more in the community</1>.`
      */
    ["com.yunke.settings.meetings.enable.description"]: ComponentType<TypedTransProps<Readonly<{}>, {
        ["1"]: JSX.Element;
    }>>;
    /**
      * `Activate using the local key from <1>Toeverything.Inc</1>`
      */
    ["com.yunke.settings.workspace.license.self-host-team.team.license"]: ComponentType<TypedTransProps<Readonly<{}>, {
        ["1"]: JSX.Element;
    }>>;
    /**
      * `Copy your workspace id and <1>reach out to us</1>.`
      */
    ["com.yunke.settings.workspace.license.self-host-team.upload-license-file.tips.content"]: ComponentType<TypedTransProps<Readonly<{}>, {
        ["1"]: JSX.Element;
    }>>;
    /**
      * `If you encounter any issues, contact support@toeverything.info. No license yet? <1>Click to purchase</1>.`
      */
    ["com.yunke.settings.workspace.license.activate-modal.tips"]: ComponentType<TypedTransProps<Readonly<{}>, {
        ["1"]: JSX.Element;
    }>>;
    /**
      * `This will make the workspace read-only. Your key remains usable elsewhere. Deactivation doesn't cancel your Team plan. To cancel, go to <1>Manage Payment</1>.`
      */
    ["com.yunke.settings.workspace.license.deactivate-modal.description"]: ComponentType<TypedTransProps<Readonly<{}>, {
        ["1"]: JSX.Element;
    }>>;
    /**
      * `The "<1>{{ name }}</1>" property will be removed. This action cannot be undone.`
      */
    ["com.yunke.settings.workspace.properties.delete-property-desc"]: ComponentType<TypedTransProps<{
        readonly name: string;
    }, {
        ["1"]: JSX.Element;
    }>>;
    /**
      * `<0>{{count}}</0> doc`
      */
    ["com.yunke.settings.workspace.properties.doc"]: ComponentType<TypedTransProps<{
        readonly count: string;
    }, {
        ["0"]: JSX.Element;
    }>>;
    /**
      * `<0>{{count}}</0> docs`
      */
    ["com.yunke.settings.workspace.properties.doc_others"]: ComponentType<TypedTransProps<{
        readonly count: string;
    }, {
        ["0"]: JSX.Element;
    }>>;
    /**
      * `Manage workspace <1>{{name}}</1> properties`
      */
    ["com.yunke.settings.workspace.properties.header.subtitle"]: ComponentType<TypedTransProps<{
        readonly name: string;
    }, {
        ["1"]: JSX.Element;
    }>>;
    /**
      * `<0>{{count}}</0> selected`
    
      * - com.yunke.tag.toolbar.selected_one: `<0>{{count}}</0> tag selected`
    
      * - com.yunke.tag.toolbar.selected_other: `<0>{{count}}</0> tag(s) selected`
      */
    ["com.yunke.tag.toolbar.selected"]: ComponentType<TypedTransProps<{
        readonly count: string | number | bigint;
    }, {
        ["0"]: JSX.Element;
    }>>;
    /**
      * `<0>{{count}}</0> tag selected`
      */
    ["com.yunke.tag.toolbar.selected_one"]: ComponentType<TypedTransProps<{
        readonly count: string | number | bigint;
    }, {
        ["0"]: JSX.Element;
    }>>;
    /**
      * `<0>{{count}}</0> tag(s) selected`
      */
    ["com.yunke.tag.toolbar.selected_other"]: ComponentType<TypedTransProps<{
        readonly count: string | number | bigint;
    }, {
        ["0"]: JSX.Element;
    }>>;
    /**
      * `<0>{{count}}</0> tag(s) selected`
      */
    ["com.yunke.tag.toolbar.selected_others"]: ComponentType<TypedTransProps<{
        readonly count: string;
    }, {
        ["0"]: JSX.Element;
    }>>;
    /**
      * `Deleting <1>{{workspace}}</1> cannot be undone, please proceed with caution. All contents will be lost.`
      */
    ["com.yunke.workspaceDelete.description"]: ComponentType<TypedTransProps<{
        readonly workspace: string;
    }, {
        ["1"]: JSX.Element;
    }>>;
    /**
      * `Deleting <1>{{workspace}}</1> will delete both local and cloud data, this operation cannot be undone, please proceed with caution.`
      */
    ["com.yunke.workspaceDelete.description2"]: ComponentType<TypedTransProps<{
        readonly workspace: string;
    }, {
        ["1"]: JSX.Element;
    }>>;
    /**
      * ` We recommend the <1>Chrome</1> browser for optimal experience.`
      */
    recommendBrowser: ComponentType<TypedTransProps<Readonly<{}>, {
        ["1"]: JSX.Element;
    }>>;
    /**
      * `Are you sure you want to upgrade <1>{{workspaceName}}</1> to a Team Workspace? This will allow unlimited members to collaborate in this workspace.`
      */
    ["com.yunke.upgrade-to-team-page.upgrade-confirm.description"]: ComponentType<TypedTransProps<{
        readonly workspaceName: string;
    }, {
        ["1"]: JSX.Element;
    }>>;
    /**
      * `<1>{{username}}</1> mentioned you in <2>{{docTitle}}</2>`
      */
    ["com.yunke.notification.mention"]: ComponentType<TypedTransProps<Readonly<{
        username: string;
        docTitle: string;
    }>, {
        ["1"]: JSX.Element;
        ["2"]: JSX.Element;
    }>>;
    /**
      * `<1>{{username}}</1> has accept your invitation`
      */
    ["com.yunke.notification.invitation-accepted"]: ComponentType<TypedTransProps<{
        readonly username: string;
    }, {
        ["1"]: JSX.Element;
    }>>;
    /**
      * `<1>{{username}}</1> has requested to join <2>{{workspaceName}}</2>`
      */
    ["com.yunke.notification.invitation-review-request"]: ComponentType<TypedTransProps<Readonly<{
        username: string;
        workspaceName: string;
    }>, {
        ["1"]: JSX.Element;
        ["2"]: JSX.Element;
    }>>;
    /**
      * `<1>{{username}}</1> has declined your request to join <2>{{workspaceName}}</2>`
      */
    ["com.yunke.notification.invitation-review-declined"]: ComponentType<TypedTransProps<Readonly<{
        username: string;
        workspaceName: string;
    }>, {
        ["1"]: JSX.Element;
        ["2"]: JSX.Element;
    }>>;
    /**
      * `<1>{{username}}</1> has approved your request to join <2>{{workspaceName}}</2>`
      */
    ["com.yunke.notification.invitation-review-approved"]: ComponentType<TypedTransProps<Readonly<{
        username: string;
        workspaceName: string;
    }>, {
        ["1"]: JSX.Element;
        ["2"]: JSX.Element;
    }>>;
    /**
      * `There is an issue regarding your invitation to <1>{{workspaceName}}</1> `
      */
    ["com.yunke.notification.invitation-blocked"]: ComponentType<TypedTransProps<{
        readonly workspaceName: string;
    }, {
        ["1"]: JSX.Element;
    }>>;
    /**
      * `<1>{{username}}</1> invited you to join <2>{{workspaceName}}</2>`
      */
    ["com.yunke.notification.invitation"]: ComponentType<TypedTransProps<Readonly<{
        username: string;
        workspaceName: string;
    }>, {
        ["1"]: JSX.Element;
        ["2"]: JSX.Element;
    }>>;
    /**
      * `Unable to join <1/> <2>{{workspaceName}}</2> due to insufficient seats available.`
      */
    ["com.yunke.fail-to-join-workspace.description-1"]: ComponentType<TypedTransProps<{
        readonly workspaceName: string;
    }, {
        ["1"]: JSX.Element;
        ["2"]: JSX.Element;
    }>>;
    /**
      * `You requested to join <1/> <2>{{workspaceName}}</2> with <3>{{userEmail}}</3>, the workspace owner and team admins will review your request.`
      */
    ["com.yunke.sent-request-to-join-workspace.description"]: ComponentType<TypedTransProps<Readonly<{
        workspaceName: string;
        userEmail: string;
    }>, {
        ["1"]: JSX.Element;
        ["2"]: JSX.Element;
        ["3"]: JSX.Element;
    }>>;
    /**
      * `Unable to process your request to join <1/> <2>{{workspaceName}}</2> with <3>{{userEmail}}</3>, the workspace has reached its member limit. Please contact the workspace owner for available seats.`
      */
    ["com.yunke.failed-to-send-request.description"]: ComponentType<TypedTransProps<Readonly<{
        workspaceName: string;
        userEmail: string;
    }>, {
        ["1"]: JSX.Element;
        ["2"]: JSX.Element;
        ["3"]: JSX.Element;
    }>>;
    /**
      * `Import your Readwise highlights to YUNKE. Please visit Readwise, <br />click <a>"Get Access Token"</a>, and paste the token below.`
      */
    ["com.yunke.integration.readwise.connect.desc"]: ComponentType<TypedTransProps<Readonly<{}>, {
        br: JSX.Element;
        a: JSX.Element;
    }>>;
    /**
      * `Updates to be imported since last successful import on {{lastImportedAt}} <a>Import everything instead</a>`
      */
    ["com.yunke.integration.readwise.import.desc-from-last"]: ComponentType<TypedTransProps<{
        readonly lastImportedAt: string;
    }, {
        a: JSX.Element;
    }>>;
    /**
      * `Please contact <1>{{user}}</1> to upgrade AI rights or resend the attachment.`
      */
    ["com.yunke.audio.transcribe.non-owner.confirm.message"]: ComponentType<TypedTransProps<{
        readonly user: string;
    }, {
        ["1"]: JSX.Element;
    }>>;
} = /*#__PURE__*/ createProxy(createComponent);

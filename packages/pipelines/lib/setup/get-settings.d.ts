export default function getSettings(yes: any, branch: any): Promise<{
    auto_deploy: boolean;
    wait_for_ci: boolean;
    pull_requests: {
        enabled: boolean;
        auto_deploy: boolean;
        auto_destroy: boolean;
    };
}>;

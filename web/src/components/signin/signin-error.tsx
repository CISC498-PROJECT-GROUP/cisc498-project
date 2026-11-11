// The warm alert line at the top of a sign-in step: why the last attempt failed. Nothing when there
// is nothing to say.

import { Icon } from '@/components/common/icon';

export function SignInError({ text }: { text: string | null }) {
    if (!text) return null;
    return (
        <p class="ca-signin-error" role="alert">
            <Icon name="alert" size={16} />
            <span>{text}</span>
        </p>
    );
}

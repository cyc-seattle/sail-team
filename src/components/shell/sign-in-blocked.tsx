import { buttonVariants } from "@/components/ui/button";
import { NoticePage } from "./notice-page";

/** Sign-in sent them straight back without a session, so the app stops rather than loop. */
export function SignInBlocked({ signInUrl }: { signInUrl: string }) {
  return (
    <NoticePage title="Sign-in didn't finish">
      <p>You came back from signing in, but the club's system didn't recognize you.</p>
      <p className="mt-4">
        <a className={buttonVariants()} href={signInUrl}>
          Try again
        </a>
      </p>
    </NoticePage>
  );
}

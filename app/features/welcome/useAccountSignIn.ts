import {useState} from 'react';

import {useAccount} from '../../state/account';
import {useSession} from '../../state/session';

// Sign-in buttons for the welcome screens. With a backend configured,
// Google goes through oto-api; without one (or before Google's client ids
// are set) the buttons keep their local behaviour.
export const useAccountSignIn = () => {
  const account = useAccount();
  const {signIn} = useSession();
  const [failed, setFailed] = useState(false);

  const attempt = async (work: () => Promise<unknown>) => {
    setFailed(false);
    try {
      await work();
    } catch {
      setFailed(true);
    }
  };

  return {
    failed,
    developerReaders: account?.developerReaders ?? [],
    continueWithGoogle: () =>
      account?.googleAvailable
        ? attempt(() => account.signInWithGoogle())
        : signIn(),
    signInAsDeveloper: (handle: string) =>
      account ? attempt(() => account.signInAsDeveloper(handle)) : undefined,
  };
};

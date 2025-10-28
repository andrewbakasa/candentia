'use client';

import { useCallback, useEffect, useState } from "react";
import { Renderable, Toast, toast, ValueFunction } from "react-hot-toast";
import { signIn } from 'next-auth/react';
import {
  FieldValues,
  SubmitHandler,
  useForm
} from "react-hook-form";
import { FcGoogle } from "react-icons/fc";
import { AiFillGithub } from "react-icons/ai";
import { usePathname, useRouter } from "next/navigation";

import useRegisterModal from "../../../app/hooks/useRegisterModal";
import useLoginModal from "../../../app/hooks/useLoginModal";

import Modal from "./Modal"; // Assuming Modal is in the same directory
import Input from "../inputs/Input"; // Assuming Input component path
import Heading from "../Heading"; // Assuming Heading component path
import Button from "../Button"; // Assuming Button component path
import { EyeIcon, EyeOffIcon} from "lucide-react";

// Mock types and hooks for demonstration purposes if not provided by the user
interface SafeUser {
  cardReadMode?: boolean;
  showMobileView?: boolean;
  showBGImage?: boolean;
  collapseBoards?: boolean;
}

const useCardReadModeStore = () => ({
  setReadModeState: (state: boolean) => console.log('setReadModeState', state),
});
const useShowBGImageStore = () => ({
  setShowBGImageState: (state: boolean) => console.log('setShowBGImageState', state),
});
const useCollapseStore = () => ({
  setCollapseState: (state: boolean) => console.log('setCollapseState', state),
});
const useCurrentUserStore = () => ({
  currentUserA: [],
  isLoadingCurrentUser: false,
  fetchCurrentUser: () => console.log('fetchCurrentUser'),
});
const useLoginLatchStore = () => ({
  loginlatch: false,
  setLatchState: (state: boolean) => console.log('setLatchState', state),
});
const useShowMobileViewStore = () => ({
  setShowMobileViewState: (state: boolean) => console.log('setShowMobileViewState', state),
});
const useAction = (action: any, options: any) => ({
  execute: (data: any) => {
    console.log('Executing action with data:', data);
    options.onSuccess({ collapseBoards: true });
  },
  fieldErrors: null,
});
const getCurrUser = async (email: string) => {
  console.log('getCurrUser called for:', email);
  return { collapseBoards: true }; // Mock response
};


interface NavbarProps {
  currentUser?: SafeUser | null;
}

const LoginModal: React.FC<NavbarProps> = ({
  currentUser,
}) => {
  const router = useRouter();
  const loginModal = useLoginModal();
  const registerModal = useRegisterModal();
  const [isLoading, setIsLoading] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [activeSocialLogin, setActiveSocialLogin] = useState<string | null>(null);

  const { setReadModeState } = useCardReadModeStore();
  const { setShowBGImageState } = useShowBGImageStore();
  const { setCollapseState } = useCollapseStore();
  const { currentUserA, isLoadingCurrentUser, fetchCurrentUser } = useCurrentUserStore();
  const { loginlatch, setLatchState } = useLoginLatchStore();
  const { setShowMobileViewState } = useShowMobileViewStore();

  const handleToggleVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  const pathname = usePathname();
  const isDeniedPage = pathname === '/denied';

  useEffect(() => {
    setReadModeState(currentUser?.cardReadMode || false);
    setShowMobileViewState(currentUser?.showMobileView || false);
    setShowBGImageState(currentUser?.showBGImage || false);

    if (loginlatch === false && currentUser) {
      setCollapseState(currentUser?.collapseBoards || false);
      setLatchState(true);
    }
  }, [currentUser, loginlatch, setReadModeState, setShowMobileViewState, setShowBGImageState, setCollapseState, setLatchState]);

  useEffect(() => {
    if (loginlatch === false && currentUser) {
      setCollapseState(currentUser?.collapseBoards || false);
      setLatchState(true);
    }
  }, [currentUser, loginlatch, setCollapseState, setLatchState]);

  useEffect(() => {
    if (currentUserA && currentUserA.length > 0) {
      execute({ email: currentUserA });
    }
  }, [currentUserA]);


  const { execute, fieldErrors } = useAction(getCurrUser, {
    onSuccess: (data: { collapseBoards: any; }) => {
      if (data) {
        setCollapseState(data?.collapseBoards || false);
      }
    },
    onError: (error: Renderable | ValueFunction<Renderable, Toast>) => {
      toast.error(error);
    },
  });

  const handleAuthenticationChange = useCallback(async () => {
    if (isLoadingCurrentUser) {
      return;
    }
    try {
      await fetchCurrentUser();
    } catch (error) {
      console.error('Error updating collapseState:', error);
      toast.error('Error fetching user data');
    }
  }, [isLoadingCurrentUser, fetchCurrentUser]);


  const {
    register,
    handleSubmit,
    formState: {
      errors,
    },
  } = useForm<FieldValues>({
    defaultValues: {
      email: '',
      password: ''
    },
  });

  // Define the target delay for successful authentication
  const AUTH_SUCCESS_DELAY = 5000; // 5 seconds in milliseconds

  const handleSignIn = (provider: string) => {
    setIsLoading(true);
    setActiveSocialLogin(provider);

    const startTime = Date.now(); // Record start time for artificial delay

    signIn(provider, { redirect: false })
      .then(result => {
        const elapsedTime = Date.now() - startTime;
        const remainingDelay = Math.max(0, AUTH_SUCCESS_DELAY - elapsedTime);

        if (result?.error) {
          toast.error(`Login failed: ${result.error}`);
          setIsLoading(false);
          setActiveSocialLogin(null);
          router.push("/");
        } else if (result?.ok) {
          toast.success('Logged in successfully! Redirecting...');
          // Keep isLoading true for the remaining delay to show "Processing..."
          // Then close modal and navigate
          setTimeout(() => {
            setIsLoading(false);
            setActiveSocialLogin(null);
            loginModal.onClose();
            router.push("/");
          }, remainingDelay);
        }
      })
      .catch(error => {
        // Even if caught, reset loading states immediately for errors
        setIsLoading(false);
        setActiveSocialLogin(null);
        console.error("Sign-in error (catch):", error);
        toast.error("Failed to sign in. Please try again.");
        router.push("/");
      });
  };

  const onSubmit: SubmitHandler<FieldValues> =
    (data) => {
    setIsLoading(true);

    const startTime = Date.now(); // Record start time for artificial delay

    signIn('credentials', {
      ...data,
      redirect: false,
    })
    .then((callback) => {
      const elapsedTime = Date.now() - startTime;
      const remainingDelay = Math.max(0, AUTH_SUCCESS_DELAY - elapsedTime);

      if (callback?.ok) {
        toast.success('Logged in successfully! Redirecting...');
        handleAuthenticationChange();

        // Keep isLoading true for the remaining delay to show "Logging in..."
        // Then close modal and navigate
        setTimeout(() => {
          setIsLoading(false);
          if (isDeniedPage) {
            router.push("/");
          }
          router.refresh();
          loginModal.onClose();
        }, remainingDelay);

      } else if (callback?.error) {
        toast.error(`Login failed: ${callback.error}`);
        setIsLoading(false); // Reset loading state immediately on error
      }
    });
  }

  const onToggle = useCallback(() => {
    loginModal.onClose();
    registerModal.onOpen();
  }, [loginModal, registerModal]);

  // Determine button labels based on loading state and active social login
  // Note: These labels will stay 'Processing...' / 'Logging in...' for the full delay.
  const getGoogleLabel = isLoading && activeSocialLogin === 'google' ? 'Processing...' : 'Continue with Google';
  const getGithubLabel = isLoading && activeSocialLogin === 'github' ? 'Processing...' : 'Continue with Github';
  const getActionLabel = isLoading && activeSocialLogin === null ? 'Logging in...' : 'Continue';

  const socialLoginContent = (
    <div className="flex flex-col gap-4">
      <Button
        outline
        label={getGoogleLabel}
        disabled={isLoading}
        icon={FcGoogle}
        onClick={() => handleSignIn('google')}
      />

      <Button
        outline
        label={getGithubLabel}
        disabled={isLoading}
        icon={AiFillGithub}
        onClick={() => handleSignIn('github')}
      />
      <div className="text-center text-neutral-500 font-light text-sm pt-2">
        Or continue with email
      </div>
      <hr className="my-4"/>
    </div>
  );

  const emailLoginContent = (
    <div className="flex flex-col gap-4">
      <Input
        id="email"
        label="Email"
        disabled={isLoading}
        register={register}
        errors={errors}
        required
      />
      <div className="relative">
        <Input
          id="password"
          label="Password"
          type={isPasswordVisible ? 'text' : 'password'}
          disabled={isLoading}
          register={register}
          errors={errors}
          required
        />
        <button
          type="button"
          onClick={handleToggleVisibility}
          className="absolute inset-y-0 right-3 flex items-center pr-2 focus:outline-none"
          aria-label={isPasswordVisible ? 'Hide password' : 'Show password'}
        >
          {isPasswordVisible ? <EyeOffIcon className="h-5 w-5 text-gray-500" /> : <EyeIcon className="h-5 w-5 text-gray-500" />}
        </button>
      </div>
    </div>
  );

  const footerContent = (
    <div className="flex flex-col gap-4 mt-3">
      <div className="
      text-neutral-500 text-center mt-4 font-light">
        <p>First time using Horizon21?
          <span
            onClick={onToggle}
            className="
              text-neutral-800
              cursor-pointer
              hover:underline
              font-medium
            "
            > Create an account</span>
        </p>
      </div>
    </div>
  );

  return (
    <Modal
      disabled={isLoading}
      isOpen={loginModal.isOpen}
      title="Welcome back"
      actionLabel={getActionLabel}
      onClose={loginModal.onClose}
      onSubmit={handleSubmit(onSubmit)}
      body={
        <div className="flex flex-col gap-4">
          {socialLoginContent}
          {emailLoginContent}
        </div>
      }
      footer={footerContent}
    />
  );
}

export default LoginModal;
// 'use client';

// import { useCallback, useEffect, useState } from "react";
// import { toast } from "react-hot-toast";
// import { signIn } from 'next-auth/react';
// import { 
//   FieldValues, 
//   SubmitHandler, 
//   useForm
// } from "react-hook-form";
// import { FcGoogle } from "react-icons/fc";
// import { AiFillGithub } from "react-icons/ai";
// import { usePathname, useRouter } from "next/navigation";

// import useRegisterModal from "../../../app/hooks/useRegisterModal";
// import useLoginModal from "../../../app/hooks/useLoginModal";

// import Modal from "./Modal";
// import Input from "../inputs/Input";
// import Heading from "../Heading";
// import Button from "../Button";
// import { EyeIcon, EyeOffIcon} from "lucide-react";
// import { SafeUser } from "@/app/types";
// import { useCardReadModeStore } from "@/hooks/use-cardReadMode";
// import { useShowBGImageStore } from "@/hooks/use-showBGImage";
// import { useCollapseStore } from "@/hooks/use-collapseState";

// import { useCurrentUserStore } from "@/hooks/use-getCurrentUser";
// import { useAction } from "@/hooks/use-action";
// import { getCurrUser } from "@/actions/getcurrent-user";
// import { useLoginLatchStore } from "@/hooks/use-login";
// import { useShowMobileViewStore } from "@/hooks/use-mobileView";

// interface NavbarProps {
//   currentUser?: SafeUser | null;
// }

// const LoginModal: React.FC<NavbarProps> = ({
//   currentUser,
// }) => {
//   // const LoginModal = () => {
//   const router = useRouter();
//   const loginModal = useLoginModal();
//   const registerModal = useRegisterModal();
//   const [isLoading, setIsLoading] = useState(false);
//   const [isPasswordVisible, setIsPasswordVisible] = useState(false);
//   const {setReadModeState}=useCardReadModeStore();
//   const {setShowBGImageState}=useShowBGImageStore();
//   const {setCollapseState}=useCollapseStore()
//   const { currentUserA, isLoadingCurrentUser, fetchCurrentUser } = useCurrentUserStore();
//   const { loginlatch, setLatchState } = useLoginLatchStore();
//   const {setShowMobileViewState}=useShowMobileViewStore();
  
//   const handleToggleVisibility = () => {
//     setIsPasswordVisible(!isPasswordVisible);
//   };
//   const [googleLabel, setGoogleLabel] = useState('Continue with Google');
//   const [githubLabel, setGithubLabel] = useState('Continue with Github');

//   const pathname = usePathname();
//   const isDeniedPage = pathname === '/denied';

//  useEffect(()=>{
//   setReadModeState(currentUser?.cardReadMode||false); 
  
//   setShowMobileViewState(currentUser?.showMobileView||false); 
//   setShowBGImageState(currentUser?.showBGImage||false)
//   // caters for google auth that doesnt have session ready
//   // toast(`n username change....${loginlatch}`)
//   console.log(`LoginModal 1....${loginlatch}`)
  
//   if (loginlatch==false && currentUser){
//     //latches----
//     // toast('Latch triggered usseffect currentuser Chenge')
//     setCollapseState(currentUser?.collapseBoards||false) 
//     setLatchState(true)
//   }
//     console.log('currentUserA',currentUserA)
//  },[currentUser])

 
//  useEffect(()=>{
//   // console.log(`LoginModal 1....${loginlatch}`)
//   if (loginlatch==false && currentUser){
//     //latches----
//     // toast('Latch triggered usseffect 1')
//     setCollapseState(currentUser?.collapseBoards||false) 
//     setLatchState(true)
//   }
// },[])

//  useEffect(()=>{
//   //console.log('currentUserA: should not be empty useEffect:',currentUserA)
 
//   if(currentUserA?.length>0){

//     execute({email:currentUserA})
//   }
  
//  },[currentUserA])
 

//   const { execute, fieldErrors } = useAction(getCurrUser, {
//     onSuccess: (data) => {
//       if (data){
//         console.log(`data:${data}  `)
//         setCollapseState(data?.collapseBoards || false); 
//       }   
//     },
//     onError: (error) => {
//       toast.error(error);
//     },
//   });
//   const handleAuthenticationChange = useCallback(async () => {
//     if (isLoadingCurrentUser) {
//       // Avoid unnecessary calls while user is loading
//       return;
//     }
//    console.log('in hande authenticationchange...')
//     try {
//       await fetchCurrentUser(); // Fetch and update currentUser
//     } catch (error) {
//       console.error('Error updating collapseState:', error);
//       toast.error('Error fetching user data'); // Inform user about the error
//     }
//   }, [currentUserA, isLoadingCurrentUser, fetchCurrentUser, setCollapseState]);


//   const { 
//     register, 
//     handleSubmit,
//     formState: {
//       errors,
//     },
//   } = useForm<FieldValues>({
//     defaultValues: {
//       email: '',
//       password: ''
//     },
//   });

//   const handleSignIn2 = async (provider:string) => {
//     setIsLoading(true); // Disable button
//     try {
//         // Replace with your actual Google Sign In logic
//         if (provider =="google"){
//           setGoogleLabel('Authenticating...')
//         }
//         if (provider =="github"){
//           setGithubLabel('Authenticating...')
//         }
//        const result= await signIn(provider, { redirect: false })
//        console.log("Authentication result:", result)
       
    
//     } catch (error) {
//         // Handle error gracefully
//     } finally {
//       //wait some 15s before enabing
//         setTimeout(() => {
//           setIsLoading(false); // Enable button
//         },15000);
//         if (provider =="google"){
//           setGoogleLabel('Finalizing...')
         
//         }
//         if (provider =="github"){
//           setGithubLabel('Finalizing...')
        
//         }
       
//         router.push("/")   
//     }
// };

// const handleSignIn = (provider: string) => {
//   setIsLoading(true);
//   console.log("Calling signIn with provider:", provider); // Debugging

//   signIn(provider, { redirect: false })
//     .then(result => {
//       console.log("SignIn Response (then):", result); //  <---  CRUCIAL: Inspect the result!

//       setIsLoading(false);
//       router.push("/"); //  Put this *inside* the then block

//       let imageUrl = ''; // Declare imageUrl

//       // if (result?.ok && result?.user?.image) {
//       //   imageUrl = result.user.image;
//       // } else if (result?.ok && result?.user?.avatar_url) {
//       //   imageUrl = result.user.avatar_url;
//       // } else if (result?.ok && result?.profile?.picture) {
//       //   imageUrl = result.profile.picture;
//       // }

//       // if (result?.ok && imageUrl) {
//       //   setUserImageUrl(imageUrl);
//       // }
//       // Handle the result (success and error)
//       if (result?.error) {
//         toast.error(`Login error: ${result.error}`);
//       } else if (result?.ok) {
//         toast.success('Logged in successfully!');
//         // ... (handle successful login, extract user data, etc.)
//       }
//     })
//     .catch(error => {
//       setIsLoading(false);
//       console.error("Sign-in error (catch):", error);
//       toast.error("Failed to sign in. Please try again.");
//       router.push("/");
//     });
// };


//   const onSubmit: SubmitHandler<FieldValues> = 
//    (data) => {
//     setIsLoading(true);

//     signIn('credentials', { 
//       ...data, 
//       redirect: false,
//     })
//     .then((callback) => {
//       setIsLoading(false);

//       if (callback?.ok) {
//         console.log('callback...',callback)
//         toast.success('Logged in');
//         handleAuthenticationChange(); // Update collapseState
    
//         //ONLY WHEN ON DENIED gO TO HOME PAGE
//         if (isDeniedPage) {
//           router.push("/")
//         }
//         router.refresh();
//         loginModal.onClose();
//       }
      
//       if (callback?.error) {
//         toast.error(callback.error);
//       }
//       // if (callback?.ok) {
//       //   // ... other code
//       // }
//     });
//   }

  
//   const onToggle = useCallback(() => {
//     loginModal.onClose();
//     registerModal.onOpen();
//   }, [loginModal, registerModal])

//   const bodyContent = (
//     <div className="flex flex-col gap-4">
//       <Heading
//         title="Welcome back"
//         subtitle="Login to your account!"
//       />
//       <Input
//         id="email"
//         label="Email"
//         disabled={isLoading}
//         register={register}  
//         errors={errors}
//         required
//       />
//       <div className="flex items-center mb-4">
//           <Input
//             id="password"
//             label="Password"
//             type={isPasswordVisible ? 'text' : 'password'}
//             disabled={isLoading}
//             register={register}
//             errors={errors}
//             required
//           />
//           <button
//               type="button"
//               onClick={handleToggleVisibility}
//               className="absolute  right-[36px] focus:outline-none"
//             >
//               {isPasswordVisible ? <EyeOffIcon className="h-5 w-5 text-gray-500" /> : <EyeIcon className="h-5 w-5 text-gray-500" />}
//             </button>
//       </div>
    
//     </div>
//   )


//   const footerContent = (
//     <div className="flex flex-col gap-4 mt-3">
//       <hr />
//       <Button 
//         outline 
//         label={googleLabel}
//         disabled={isLoading}
//         icon={FcGoogle}
//         onClick={() => handleSignIn('google')}
//       />
     
//       <Button 
//         outline 
//         label={githubLabel} 
//         disabled={isLoading}
//         icon={AiFillGithub}
//         onClick={() => handleSignIn('github')}
//         />
//       <div className="
//       text-neutral-500 text-center mt-4 font-light">
//         <p>First time using EEG?
//           <span 
//             onClick={onToggle} 
//             className="
//               text-neutral-800
//               cursor-pointer 
//               hover:underline
//             "
//             > Create an account</span>
//         </p>
//       </div>
//     </div>
//   )

//   return (
//     <Modal
//       disabled={isLoading}
//       isOpen={loginModal.isOpen}
//       title="Login"
//       actionLabel="Continue"
//       onClose={loginModal.onClose}
//       onSubmit={handleSubmit(onSubmit)}
//       body={bodyContent}
//       footer={footerContent}
//     />
//   );
// }

// export default LoginModal;

'use client';

import { useCallback, useEffect, useState } from "react";
import { toast } from "react-hot-toast";
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

import Modal from "./Modal";
import Input from "../inputs/Input";
import Heading from "../Heading";
import Button from "../Button";
import { EyeIcon, EyeOffIcon} from "lucide-react";
import { SafeUser } from "@/app/types";
import { useCardReadModeStore } from "@/hooks/use-cardReadMode";
import { useShowBGImageStore } from "@/hooks/use-showBGImage";
import { useCollapseStore } from "@/hooks/use-collapseState";

import { useCurrentUserStore } from "@/hooks/use-getCurrentUser";
import { useAction } from "@/hooks/use-action";
import { getCurrUser } from "@/actions/getcurrent-user";
import { useLoginLatchStore } from "@/hooks/use-login";
import { useShowMobileViewStore } from "@/hooks/use-mobileView";

interface NavbarProps {
  currentUser?: SafeUser | null;
}

const LoginModal: React.FC<NavbarProps> = ({
  currentUser,
}) => {
  // const LoginModal = () => {
  const router = useRouter();
  const loginModal = useLoginModal();
  const registerModal = useRegisterModal();
  const [isLoading, setIsLoading] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const {setReadModeState}=useCardReadModeStore();
  const {setShowBGImageState}=useShowBGImageStore();
  const {setCollapseState}=useCollapseStore()
  const { currentUserA, isLoadingCurrentUser, fetchCurrentUser } = useCurrentUserStore();
  const { loginlatch, setLatchState } = useLoginLatchStore();
  const {setShowMobileViewState}=useShowMobileViewStore();
  
  const handleToggleVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };
  const [googleLabel, setGoogleLabel] = useState('Continue with Google');
  const [githubLabel, setGithubLabel] = useState('Continue with Github');

  const pathname = usePathname();
  const isDeniedPage = pathname === '/denied';

 useEffect(()=>{
  setReadModeState(currentUser?.cardReadMode||false); 
  
  setShowMobileViewState(currentUser?.showMobileView||false); 
  setShowBGImageState(currentUser?.showBGImage||false)
  // caters for google auth that doesnt have session ready
  // toast(`n username change....${loginlatch}`)
  console.log(`LoginModal 1....${loginlatch}`)
  
  if (loginlatch==false && currentUser){
    //latches----
    // toast('Latch triggered usseffect currentuser Chenge')
    setCollapseState(currentUser?.collapseBoards||false) 
    setLatchState(true)
  }
    console.log('currentUserA',currentUserA)
 },[currentUser])

 
 useEffect(()=>{
  // console.log(`LoginModal 1....${loginlatch}`)
  if (loginlatch==false && currentUser){
    //latches----
    // toast('Latch triggered usseffect 1')
    setCollapseState(currentUser?.collapseBoards||false) 
    setLatchState(true)
  }
},[])

 useEffect(()=>{
  //console.log('currentUserA: should not be empty useEffect:',currentUserA)
 
  if(currentUserA?.length>0){

    execute({email:currentUserA})
  }
  
 },[currentUserA])
 

  const { execute, fieldErrors } = useAction(getCurrUser, {
    onSuccess: (data) => {
      if (data){
        console.log(`data:${data}  `)
        setCollapseState(data?.collapseBoards || false); 
      }   
    },
    onError: (error) => {
      toast.error(error);
    },
  });
  const handleAuthenticationChange = useCallback(async () => {
    if (isLoadingCurrentUser) {
      // Avoid unnecessary calls while user is loading
      return;
    }
   console.log('in hande authenticationchange...')
    try {
      await fetchCurrentUser(); // Fetch and update currentUser
    } catch (error) {
      console.error('Error updating collapseState:', error);
      toast.error('Error fetching user data'); // Inform user about the error
    }
  }, [currentUserA, isLoadingCurrentUser, fetchCurrentUser, setCollapseState]);


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

  const handleSignIn2 = async (provider:string) => {
    setIsLoading(true); // Disable button
    try {
        // Replace with your actual Google Sign In logic
        if (provider =="google"){
          setGoogleLabel('Authenticating...')
        }
        if (provider =="github"){
          setGithubLabel('Authenticating...')
        }
       const result= await signIn(provider, { redirect: false })
       console.log("Authentication result:", result)
       
    
    } catch (error) {
        // Handle error gracefully
    } finally {
      //wait some 15s before enabing
        setTimeout(() => {
          setIsLoading(false); // Enable button
        },15000);
        if (provider =="google"){
          setGoogleLabel('Finalizing...')
         
        }
        if (provider =="github"){
          setGithubLabel('Finalizing...')
        
        }
       
        router.push("/")   
    }
};

const handleSignIn = (provider: string) => {
  setIsLoading(true);
  console.log("Calling signIn with provider:", provider); // Debugging

  signIn(provider, { redirect: false })
    .then(result => {
      console.log("SignIn Response (then):", result); //  <---  CRUCIAL: Inspect the result!

      setIsLoading(false);
      router.push("/"); //  Put this *inside* the then block

      let imageUrl = ''; // Declare imageUrl

      // if (result?.ok && result?.user?.image) {
      //   imageUrl = result.user.image;
      // } else if (result?.ok && result?.user?.avatar_url) {
      //   imageUrl = result.user.avatar_url;
      // } else if (result?.ok && result?.profile?.picture) {
      //   imageUrl = result.profile.picture;
      // }

      // if (result?.ok && imageUrl) {
      //   setUserImageUrl(imageUrl);
      // }
      // Handle the result (success and error)
      if (result?.error) {
        toast.error(`Login error: ${result.error}`);
      } else if (result?.ok) {
        toast.success('Logged in successfully!');
        // ... (handle successful login, extract user data, etc.)
      }
    })
    .catch(error => {
      setIsLoading(false);
      console.error("Sign-in error (catch):", error);
      toast.error("Failed to sign in. Please try again.");
      router.push("/");
    });
};


  const onSubmit: SubmitHandler<FieldValues> = 
   (data) => {
    setIsLoading(true);

    signIn('credentials', { 
      ...data, 
      redirect: false,
    })
    .then((callback) => {
      setIsLoading(false);

      if (callback?.ok) {
        console.log('callback...',callback)
        toast.success('Logged in');
        handleAuthenticationChange(); // Update collapseState
    
        //ONLY WHEN ON DENIED gO TO HOME PAGE
        if (isDeniedPage) {
          router.push("/")
        }
        router.refresh();
        loginModal.onClose();
      }
      
      if (callback?.error) {
        toast.error(callback.error);
      }
      // if (callback?.ok) {
      //   // ... other code
      // }
    });
  }

  
  const onToggle = useCallback(() => {
    loginModal.onClose();
    registerModal.onOpen();
  }, [loginModal, registerModal])

  const bodyContent = (
    <div className="flex flex-col gap-4">
      <Heading
        title="Welcome back"
        subtitle="Login to your account!"
      />
      <Input
        id="email"
        label="Email"
        disabled={isLoading}
        register={register}  
        errors={errors}
        required
      />
      <div className="flex items-center mb-4">
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
              className="absolute  right-[36px] focus:outline-none"
            >
              {isPasswordVisible ? <EyeOffIcon className="h-5 w-5 text-gray-500" /> : <EyeIcon className="h-5 w-5 text-gray-500" />}
            </button>
      </div>
    
    </div>
  )


  const footerContent = (
    <div className="flex flex-col gap-4 mt-3">
      <hr />
      <Button 
        outline 
        label={googleLabel}
        disabled={isLoading}
        icon={FcGoogle}
        onClick={() => handleSignIn('google')}
      />
     
      <Button 
        outline 
        label={githubLabel} 
        disabled={isLoading}
        icon={AiFillGithub}
        onClick={() => handleSignIn('github')}
        />
      <div className="
      text-neutral-500 text-center mt-4 font-light">
        <p>First time using Candentia?
          <span 
            onClick={onToggle} 
            className="
              text-neutral-800
              cursor-pointer 
              hover:underline
            "
            > Create an account</span>
        </p>
      </div>
    </div>
  )

  return (
    <Modal
      disabled={isLoading}
      isOpen={loginModal.isOpen}
      title="Login"
      actionLabel="Continue"
      onClose={loginModal.onClose}
      onSubmit={handleSubmit(onSubmit)}
      body={bodyContent}
      footer={footerContent}
    />
  );
}

export default LoginModal;

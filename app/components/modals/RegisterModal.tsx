'use client';

import axios from "axios";
import { AiFillGithub } from "react-icons/ai";
import { signIn } from "next-auth/react";
import { FcGoogle } from "react-icons/fc";
import { useCallback, useState } from "react";
import { toast } from "react-hot-toast";
import { EyeIcon, EyeOffIcon, Loader2 } from "lucide-react"; // Loader2 can be used for a spinner
import {
  FieldValues,
  SubmitHandler,
  useForm
} from "react-hook-form";

import Modal from "./Modal"; // Assuming Modal is in the same directory
import Input from "../inputs/Input"; // Assuming Input component path
import Heading from "../Heading"; // Assuming Heading component path
import Button from "../Button"; // Assuming Button component path
import useRegisterModal from "@/app/hooks/useRegisterModal";
import useLoginModal from "@/app/hooks/useLoginModal";


const RegisterModal= () => {
  const registerModal = useRegisterModal();
  const loginModal = useLoginModal();
  const [isLoading, setIsLoading] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  // State for social button labels and loading indicators
  const [googleAuthLoading, setGoogleAuthLoading] = useState(false);
  const [githubAuthLoading, setGithubAuthLoading] = useState(false);

  const handleToggleVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  const {
    register,
    handleSubmit,
    formState: {
      errors,
    },
  } = useForm<FieldValues>({
    defaultValues: {
      name: '',
      email: '',
      password: '',
    },
  });

  const onSubmit: SubmitHandler<FieldValues> = (data) => {
    setIsLoading(true);

    axios.post('/api/register', data)
    .then(() => {
      toast.success('Registration successful! Please log in.'); // Clearer message
      registerModal.onClose();
      loginModal.onOpen();
    })
    .catch((error) => {
      // Improved error handling to display specific message if available
      toast.error(error.response?.data?.error || 'Something went wrong during registration!');
    })
    .finally(() => {
      setIsLoading(false);
    });
  };

  const onToggle = useCallback(() => {
    registerModal.onClose();
    loginModal.onOpen();
  }, [registerModal, loginModal]);

  const handleSocialSignIn = useCallback(async (provider: string) => {
    if (provider === 'google') setGoogleAuthLoading(true);
    if (provider === 'github') setGithubAuthLoading(true);
    setIsLoading(true); // Disable all form elements during social sign-in

    try {
      const result = await signIn(provider, { redirect: false });

      if (result?.error) {
        toast.error(`Sign-in failed: ${result.error}`);
      } else if (result?.ok) {
        toast.success('Signed in successfully! Redirecting...');
        // For social sign-up/sign-in, usually you redirect or close the modal and log in.
        // Assuming successful social sign-in means they are now authenticated,
        // you might close the modal directly or redirect.
        registerModal.onClose();
        // If social sign-in automatically logs them in, no need to open login modal.
        // If it creates an account but doesn't log in, then open login modal.
        // For simplicity, I'm assuming direct login here.
        // If your NextAuth setup requires a separate login step after social register, keep loginModal.onOpen()
        // loginModal.onOpen(); // Uncomment if social register needs explicit login
      }
    } catch (error) {
      console.error("Social sign-in error:", error);
      toast.error("Failed to sign in with " + provider);
    } finally {
      if (provider === 'google') setGoogleAuthLoading(false);
      if (provider === 'github') setGithubAuthLoading(false);
      setIsLoading(false); // Re-enable form elements
    }
  }, [registerModal]); // Removed loginModal from dependency array assuming direct login after social sign-in


  // Determine button labels based on loading state and active social login
  const getGoogleLabel = googleAuthLoading ? 'Authenticating...' : 'Continue with Google';
  const getGithubLabel = githubAuthLoading ? 'Authenticating...' : 'Continue with Github';
  const getActionLabel = isLoading && !googleAuthLoading && !githubAuthLoading ? 'Registering...' : 'Continue';


  const socialRegisterContent = (
    <div className="flex flex-col gap-4">
      <Button
        outline
        label={getGoogleLabel}
        disabled={isLoading || googleAuthLoading}
        icon={googleAuthLoading ? Loader2 : FcGoogle}
        iconClassName={googleAuthLoading ? "animate-spin" : ""}
        onClick={() => handleSocialSignIn('google')}
      />

      <Button
        outline
        label={getGithubLabel}
        disabled={isLoading || githubAuthLoading}
        icon={githubAuthLoading ? Loader2 : AiFillGithub}
        iconClassName={githubAuthLoading ? "animate-spin" : ""}
        onClick={() => handleSocialSignIn('github')}
      />
      <div className="text-center text-neutral-500 font-light text-sm pt-2">
        Or register with email
      </div>
      <hr className="my-4"/>
    </div>
  );

  const emailRegisterContent = (
    <div className="flex flex-col gap-4">
      <Input
        id="name"
        label="Name"
        disabled={isLoading}
        register={register}
        errors={errors}
        required
      />
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
      <div
        className="
          text-neutral-500
          text-center
          mt-4
          font-light
        "
      >
        <p>Already have an account?
          <span
            onClick={onToggle}
            className="
              text-neutral-800
              cursor-pointer
              hover:underline
              font-medium
            "
          > Log in</span>
        </p>
      </div>
    </div>
  );

  return (
    <Modal
      disabled={isLoading}
      isOpen={registerModal.isOpen}
      title="Create an account" 
      
      
      actionLabel={getActionLabel}
      onClose={registerModal.onClose}
      onSubmit={handleSubmit(onSubmit)}
      body={
        <div className="flex flex-col gap-4">
          {socialRegisterContent}
          {emailRegisterContent}
        </div>
      }
      footer={footerContent}
    />
  );
}

export default RegisterModal;
// 'use client';

// import axios from "axios";
// import { AiFillGithub } from "react-icons/ai";
// import { signIn } from "next-auth/react";
// import { FcGoogle } from "react-icons/fc";
// import { useCallback, useState } from "react";
// import { toast } from "react-hot-toast";
// import { EyeIcon, EyeOffIcon, Loader2 } from "lucide-react";
// import { 
//   FieldValues, 
//   SubmitHandler,
//   useForm
// } from "react-hook-form";

// import useLoginModal from "../../../app/hooks/useLoginModal";
// import useRegisterModal from "../../../app/hooks/useRegisterModal";

// import Modal from "./Modal";
// import Input from "../inputs/Input";
// import Heading from "../Heading";
// import Button from "../Button";

// const RegisterModal= () => {
//   const registerModal = useRegisterModal();
//   const loginModal = useLoginModal();
//   const [isLoading, setIsLoading] = useState(false);
//   const [isPasswordVisible, setIsPasswordVisible] = useState(false);
//   const handleToggleVisibility = () => {
//     setIsPasswordVisible(!isPasswordVisible);
//   };
//   const [googleLabel, setGoogleLabel] = useState('Continue with Google');
//   const [githubLabel, setGithubLabel] = useState('Continue with Github');

//   const { 
//     register, 
//     handleSubmit,
//     formState: {
//       errors,
//     },
//   } = useForm<FieldValues>({
//     defaultValues: {
//       name: '',
//       email: '',
//       password: '',
//       //roles:['visitor']// to test if this fixes the bug: 30..03..2024 :0128hrs
//     },
//   });

//   const onSubmit: SubmitHandler<FieldValues> = (data) => {
//     setIsLoading(true);

//     axios.post('/api/register', data)
//     .then(() => {
//       toast.success('Registered!');
//       registerModal.onClose();
//       loginModal.onOpen();
//     })
//     .catch((error) => {
//       toast.error(error);
//     })
//     .finally(() => {
//       setIsLoading(false);
//     })
//   }

//   const onToggle = useCallback(() => {
//     registerModal.onClose();
//     loginModal.onOpen();
//   }, [registerModal, loginModal])

//   const bodyContent = (
//     <div className="flex flex-col gap-4">
//       <Heading
//         title="Welcome to EEG"
//         subtitle="Create an account!"
//       />
//       <Input
//         id="email"
//         label="Email"
//         disabled={isLoading}
//         register={register}
//         errors={errors}
//         required
//       />
//       <Input
//         id="name"
//         label="Name"
//         disabled={isLoading}
//         register={register}
//         errors={errors}
//         required
//       />
//       {/* <Input
//         id="password"
//         label="Password"
//         type="password"
//         disabled={isLoading}
//         register={register}
//         errors={errors}
//         required
//       /> */}

//        <div className="flex items-center mb-4">
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
//         </div>
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
//       />
//       <div 
//         className="
//           text-neutral-500 
//           text-center 
//           mt-4 
//           font-light
//         "
//       >
//         <p>Already have an account?
//           <span 
//             onClick={onToggle} 
//             className="
//               text-neutral-800
//               cursor-pointer 
//               hover:underline
//             "
//             > Log in</span>
//         </p>
//       </div>
//     </div>
//   )
//   const handleSignIn = async (provider:string) => {
//     setIsLoading(true); // Disable button

//     try {
//         // Replace with your actual Google Sign In logic
//         if (provider =="google"){
//           setGoogleLabel('Authenticating...')

//         }
//         if (provider =="github"){
//           setGithubLabel('Authenticating...')
//         }
//         await signIn(provider); // Example Google Sign In function
//         // Navigate to desired page or handle success
       
//     } catch (error) {
//         // Handle error gracefully
//     } finally {
//       //wait some 5s before enabing
//         setTimeout(() => {
//           setIsLoading(false); // Enable button
//         },5000);
//         if (provider =="google"){
//           setGoogleLabel('Finalizing...')
//         }
//         if (provider =="github"){
//           setGithubLabel('Finalizing...')
//         }
//     }
// };
//   return (
//     <Modal
//       disabled={isLoading}
//       isOpen={registerModal.isOpen}
//       title="Register"
//       actionLabel="Continue"
//       onClose={registerModal.onClose}
//       onSubmit={handleSubmit(onSubmit)}
//       body={bodyContent}
//       footer={footerContent}
//     />
//   );
// }

// export default RegisterModal;

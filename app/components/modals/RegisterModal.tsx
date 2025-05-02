'use client';

import axios from "axios";
import { AiFillGithub } from "react-icons/ai";
import { signIn } from "next-auth/react";
import { FcGoogle } from "react-icons/fc";
import { useCallback, useState } from "react";
import { toast } from "react-hot-toast";
import { EyeIcon, EyeOffIcon, Loader2 } from "lucide-react";
import { 
  FieldValues, 
  SubmitHandler,
  useForm
} from "react-hook-form";

import useLoginModal from "../../../app/hooks/useLoginModal";
import useRegisterModal from "../../../app/hooks/useRegisterModal";

import Modal from "./Modal";
import Input from "../inputs/Input";
import Heading from "../Heading";
import Button from "../Button";

const RegisterModal= () => {
  const registerModal = useRegisterModal();
  const loginModal = useLoginModal();
  const [isLoading, setIsLoading] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const handleToggleVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };
  const [googleLabel, setGoogleLabel] = useState('Continue with Google');
  const [githubLabel, setGithubLabel] = useState('Continue with Github');

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
      //roles:['visitor']// to test if this fixes the bug: 30..03..2024 :0128hrs
    },
  });

  const onSubmit: SubmitHandler<FieldValues> = (data) => {
    setIsLoading(true);

    axios.post('/api/register', data)
    .then(() => {
      toast.success('Registered!');
      registerModal.onClose();
      loginModal.onOpen();
    })
    .catch((error) => {
      toast.error(error);
    })
    .finally(() => {
      setIsLoading(false);
    })
  }

  const onToggle = useCallback(() => {
    registerModal.onClose();
    loginModal.onOpen();
  }, [registerModal, loginModal])

  const bodyContent = (
    <div className="flex flex-col gap-4">
      <Heading
        title="Welcome to Candentia"
        subtitle="Create an account!"
      />
      <Input
        id="email"
        label="Email"
        disabled={isLoading}
        register={register}
        errors={errors}
        required
      />
      <Input
        id="name"
        label="Name"
        disabled={isLoading}
        register={register}
        errors={errors}
        required
      />
      {/* <Input
        id="password"
        label="Password"
        type="password"
        disabled={isLoading}
        register={register}
        errors={errors}
        required
      /> */}

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
            "
            > Log in</span>
        </p>
      </div>
    </div>
  )
  const handleSignIn = async (provider:string) => {
    setIsLoading(true); // Disable button

    try {
        // Replace with your actual Google Sign In logic
        if (provider =="google"){
          setGoogleLabel('Authenticating...')

        }
        if (provider =="github"){
          setGithubLabel('Authenticating...')
        }
        await signIn(provider); // Example Google Sign In function
        // Navigate to desired page or handle success
       
    } catch (error) {
        // Handle error gracefully
    } finally {
      //wait some 5s before enabing
        setTimeout(() => {
          setIsLoading(false); // Enable button
        },5000);
        if (provider =="google"){
          setGoogleLabel('Finalizing...')
        }
        if (provider =="github"){
          setGithubLabel('Finalizing...')
        }
    }
};
  return (
    <Modal
      disabled={isLoading}
      isOpen={registerModal.isOpen}
      title="Register"
      actionLabel="Continue"
      onClose={registerModal.onClose}
      onSubmit={handleSubmit(onSubmit)}
      body={bodyContent}
      footer={footerContent}
    />
  );
}

export default RegisterModal;

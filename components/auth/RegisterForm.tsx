"use client";

import React, { useState, useEffect } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { RegisterSchema } from "@/lib/form_schema";
import { registerUser } from "@/lib/actions/user";
import { useRouter } from "next/navigation";
import { toast } from "../../hooks/use-toast";
import { Mail, Lock, User, Loader2 } from 'lucide-react';
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

type Inputs = z.infer<typeof RegisterSchema>;

const RegisterForm = () => {
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  const form = useForm<Inputs>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: {
      email: "",
      password: "",
      name: "",
    }
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const processForm: SubmitHandler<Inputs> = async (data) => {
    const validatedData = RegisterSchema.safeParse(data);
    setLoading(true);

    if (!validatedData.success) {
      console.log("Something went wrong");
      setLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append("email", validatedData.data.email);
    formData.append("password", validatedData.data.password);
    formData.append("name", validatedData.data.name);

    const result = await registerUser(formData);
    console.log(result);

    if (result.error) {
      console.log(result.error);
      setLoading(false);
      return;
    } else {
      setLoading(false);
      toast({
        title: "Profile Created!",
        description: "Your profile has been created successfully",
        duration: 5000,
      });
      router.push("/login");
    }
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-8 rounded-xl bg-white p-10 shadow-2xl">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold text-gray-900">Create an account</h2>
          <p className="mt-2 text-sm text-gray-600">
            Register to get started
          </p>
        </div>
        <form onSubmit={form.handleSubmit(processForm)} className="mt-8 space-y-6">
          <div className="space-y-4 rounded-md shadow-sm">
            <div>
              <Label htmlFor="name" className="sr-only">
                Name
              </Label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                  id="name"
                  {...form.register("name")}
                  type="text"
                  required
                  className="block w-full rounded-md border-gray-300 pl-10 focus:border-[#00B9AD] focus:ring-[#00B9AD]"
                  placeholder="Full Name"
                />
              </div>
              {form.formState.errors.name && (
                <p className="mt-1 text-xs text-red-600">{form.formState.errors.name.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="email" className="sr-only">
                Email address
              </Label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                  id="email"
                  {...form.register("email")}
                  type="email"
                  autoComplete="email"
                  required
                  className="block w-full rounded-md border-gray-300 pl-10 focus:border-[#00B9AD] focus:ring-[#00B9AD]"
                  placeholder="Email address"
                />
              </div>
              {form.formState.errors.email && (
                <p className="mt-1 text-xs text-red-600">{form.formState.errors.email.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="password" className="sr-only">
                Password
              </Label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                  id="password"
                  {...form.register("password")}
                  type="password"
                  autoComplete="new-password"
                  required
                  className="block w-full rounded-md border-gray-300 pl-10 focus:border-[#00B9AD] focus:ring-[#00B9AD]"
                  placeholder="Password"
                />
              </div>
              {form.formState.errors.password && (
                <p className="mt-1 text-xs text-red-600">{form.formState.errors.password.message}</p>
              )}
            </div>
          </div>

          <div>
            <Button
              type="submit"
              disabled={loading}
              className="group relative flex w-full justify-center rounded-md bg-[#00B9AD] px-4 py-2 text-sm font-medium text-white hover:bg-[#008C82] focus:outline-none focus:ring-2 focus:ring-[#00B9AD] focus:ring-offset-2"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Registering...
                </>
              ) : (
                "Register"
              )}
            </Button>
          </div>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{" "}
            <a href="/login" className="font-medium text-[#00B9AD] hover:text-[#008C82]">
              Sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterForm;


"use client";
import React, { useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { RegisterSchema } from "@/lib/form_schema";
import { Loader2 } from "lucide-react";
import { toast } from "../../hooks/use-toast";
import { registerUser } from "@/lib/actions/user";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";

type Inputs = z.infer<typeof RegisterSchema>;

const RegisterForm = () => {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const form = useForm<Inputs>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: {
      email: "",
      password: "",
      name: "",
    }
  });

  const processForm: SubmitHandler<Inputs> = async (data) => {
    const validatedData = RegisterSchema.safeParse(data);
    setLoading(true);

    if (!validatedData.success) {
      console.log("Something went wrong");
      return;
    }

    const formData = new FormData();
    formData.append("email", validatedData.data.email);
    formData.append("password", validatedData.data.password);
    formData.append("name", validatedData.data.name);

    const result = await registerUser(formData);
    console.log(result);

    if (result.error) {
      // set local error state
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
  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle className="text-2xl">Register</CardTitle>
        <CardDescription>
          Register for an account to get started
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(processForm)}
            className="space-y-5 w-full"
          >
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="example@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input placeholder="Password" type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="-mt-3 w-full" disabled={loading}>
              {loading && <Loader2 className="animate-spin" />}
              {loading ? "Registering..." : "Register"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default RegisterForm;

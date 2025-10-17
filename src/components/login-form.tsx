"use client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldGroup } from "@/components/ui/field";
import { signIn } from "@/lib/auth-client";

export function LoginForm({
    className,
    ...props
}: React.ComponentProps<"div">) {
    return (
        <div className={cn("flex flex-col gap-6", className)} {...props}>
            <Card>
                <CardHeader>
                    <CardTitle>Login to your account with github</CardTitle>
                </CardHeader>
                <CardContent>
                    <form
                    onSubmit={async (e)=> {
                        e.preventDefault();
                        await signIn();
                    }}
                    >
                        <FieldGroup>
                            <Field>
                                <Button
                                    variant="outline"
                                    type="submit"
                                    className="cursor-pointer"
                                >
                                    Login with Github
                                </Button>
                            </Field>
                        </FieldGroup>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}

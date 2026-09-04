"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { ChipSelect } from "@/components/ui/chip-select";
import { Select } from "@/components/ui/select";

function ToastDemo() {
  const { toast } = useToast();
  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="secondary"
        onClick={() =>
          toast({ title: "اطلاع", description: "یک پیام اطلاع‌رسانی." })
        }
      >
        توست اطلاع
      </Button>
      <Button
        variant="secondary"
        onClick={() =>
          toast({
            title: "موفق",
            description: "عملیات با موفقیت انجام شد.",
            tone: "success",
          })
        }
      >
        توست موفق
      </Button>
      <Button
        variant="secondary"
        onClick={() =>
          toast({
            title: "خطا",
            description: "عملیات ناموفق بود.",
            tone: "danger",
          })
        }
      >
        توست خطا
      </Button>
    </div>
  );
}

export function UiPreview() {
  const [modalOpen, setModalOpen] = useState(false);
  const [chips, setChips] = useState<string[]>([]);

  return (
    <div className="space-y-10">
      <header>
        <h1 className="text-2xl font-extrabold">کیت طراحی فاز ۱</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          پیش‌نمایش کامپوننت‌های پایه برای بررسی روی موبایل و دسکتاپ.
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="text-base font-bold">دکمه‌ها</h2>
        <div className="flex flex-wrap items-center gap-2">
          <Button>اصلی</Button>
          <Button variant="secondary">ثانویه</Button>
          <Button variant="outline">خط‌دار</Button>
          <Button variant="ghost">متن</Button>
          <Button variant="destructive">مخرب</Button>
          <Button loading>در حال ارسال</Button>
          <Button disabled>غیرفعال</Button>
          <Button size="sm">کوچک</Button>
          <Button size="lg">بزرگ</Button>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-bold">فرم‌ها</h2>
        <div className="grid max-w-md gap-3">
          <Input placeholder="ایمیل یا شماره موبایل" />
          <Input placeholder="ورودی نامعتبر" invalid />
          <Textarea placeholder="شرح مسئله…" />
          <Select placeholder="انتخاب استان">
            <option>خراسان رضوی</option>
            <option>تهران</option>
          </Select>
          <ChipSelect
            label="مهارت‌ها"
            options={["بهداشت خانواده", "ایمن‌سازی", "تغذیه"]}
            selected={chips}
            onToggle={(value) =>
              setChips((current) =>
                current.includes(value)
                  ? current.filter((item) => item !== value)
                  : [...current, value],
              )
            }
          />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-bold">نشان‌ها</h2>
        <div className="flex flex-wrap gap-2">
          <Badge>پیش‌فرض</Badge>
          <Badge tone="brand">برند</Badge>
          <Badge tone="success">موفق</Badge>
          <Badge tone="warning">هشدار</Badge>
          <Badge tone="danger">خطا</Badge>
          <Badge tone="info">اطلاع</Badge>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-bold">بارگذاری</h2>
        <div className="flex items-center gap-4">
          <Spinner size="sm" />
          <Spinner />
          <Spinner size="lg" />
        </div>
        <div className="flex flex-col gap-2">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-72" />
          <Skeleton className="h-24 w-full max-w-md" />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-bold">تب‌ها</h2>
        <Tabs defaultValue="questions">
          <TabsList>
            <TabsTrigger value="questions">مسئله‌ها</TabsTrigger>
            <TabsTrigger value="experiences">تجربه‌ها</TabsTrigger>
          </TabsList>
          <TabsContent value="questions">
            <p className="text-muted-foreground text-sm">
              محتوای تب «مسئله‌ها».
            </p>
          </TabsContent>
          <TabsContent value="experiences">
            <p className="text-muted-foreground text-sm">
              محتوای تب «تجربه‌ها».
            </p>
          </TabsContent>
        </Tabs>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-bold">مودال</h2>
        <Button variant="outline" onClick={() => setModalOpen(true)}>
          باز کردن مودال
        </Button>
        <Modal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          title="ثبت مسئله"
          description="پس از ثبت، همکاران می‌توانند پاسخ دهند."
        >
          <Textarea placeholder="شرح کوتاه مسئله…" />
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>
              انصراف
            </Button>
            <Button onClick={() => setModalOpen(false)}>ثبت</Button>
          </div>
        </Modal>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-bold">توست</h2>
        <ToastDemo />
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-bold">حالت خالی</h2>
        <EmptyState
          title="هنوز مسئله‌ای ثبت نشده"
          description="اولین مسئله را شما ثبت کنید تا گفت‌وگو شروع شود."
          action={<Button size="sm">ثبت اولین مسئله</Button>}
        />
      </section>
    </div>
  );
}

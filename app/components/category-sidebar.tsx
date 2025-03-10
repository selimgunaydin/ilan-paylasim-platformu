import { useQuery } from "@tanstack/react-query";
import { Category } from "@shared/schemas";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";


interface CategorySidebarProps {
  className?: string;
}

export default function CategorySidebar({ className }: CategorySidebarProps) {
  const router = useRouter();
  const { data: categories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const mainCategories = categories?.filter(c => !c.parentId) || [];

  return (
    <nav className={cn("space-y-4", className)}>
      <div className="font-semibold text-lg mb-4">Categories</div>

      {mainCategories.map((category) => {
        const subCategories = categories?.filter(c => c.parentId === category.id);

        return (
          <div key={category.id} className="space-y-2">
            <Link href={`/?category=${category.id}`}>
              <div className={cn(
                "w-full text-left px-4 py-2 rounded-md transition-colors",
                router.pathname === `/?category=${category.id}`
                  ? "bg-secondary text-secondary-foreground"
                  : "hover:bg-secondary/50"
              )}>
                {category.name}
              </div>
            </Link>

            {subCategories?.map((sub) => (
              <Link key={sub.id} href={`/?category=${sub.id}`}>
                <div className={cn(
                  "w-full text-left pl-6 px-4 py-2 text-sm rounded-md transition-colors",
                  router.pathname === `/?category=${sub.id}`
                    ? "bg-secondary text-secondary-foreground"
                    : "hover:bg-secondary/50"
                )}>
                  {sub.name}
                </div>
              </Link>
            ))}
          </div>
        );
      })}
    </nav>
  );
}
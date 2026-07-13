import { SellListingScreen } from "@/components/marketplace/management-screens";
import { marketplacePageShell } from "@/components/marketplace/page-shell";
export default function Page({ params }: { params: Promise<{ locale: string }> }) { return marketplacePageShell(params, (locale, dictionary) => <SellListingScreen locale={locale} dictionary={dictionary} />); }

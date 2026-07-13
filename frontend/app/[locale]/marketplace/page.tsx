import { MarketplaceScreen } from "@/components/marketplace/public-screens";
import { marketplacePageShell } from "@/components/marketplace/page-shell";
export default function Page({ params }: { params: Promise<{ locale: string }> }) { return marketplacePageShell(params, (locale, dictionary) => <MarketplaceScreen locale={locale} dictionary={dictionary} />); }

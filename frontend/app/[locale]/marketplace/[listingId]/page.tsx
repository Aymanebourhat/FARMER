import { ListingDetailScreen } from "@/components/marketplace/public-screens";
import { marketplacePageShell } from "@/components/marketplace/page-shell";
export default function Page({ params }: { params: Promise<{ locale: string; listingId: string }> }) { return marketplacePageShell(params, (locale, dictionary) => <Detail locale={locale} dictionary={dictionary} params={params} />); }
async function Detail({ locale, dictionary, params }: { locale: Parameters<typeof ListingDetailScreen>[0]["locale"]; dictionary: Parameters<typeof ListingDetailScreen>[0]["dictionary"]; params: Promise<{ locale: string; listingId: string }> }) { const { listingId } = await params; return <ListingDetailScreen locale={locale} dictionary={dictionary} listingId={listingId} />; }

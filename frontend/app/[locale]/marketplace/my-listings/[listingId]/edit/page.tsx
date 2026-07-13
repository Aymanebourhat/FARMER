import { EditListingScreen } from "@/components/marketplace/edit-listing-screen";
import { marketplacePageShell } from "@/components/marketplace/page-shell";
export default function Page({ params }: { params: Promise<{ locale: string; listingId: string }> }) { return marketplacePageShell(params, (locale, dictionary) => <Edit locale={locale} dictionary={dictionary} params={params} />); }
async function Edit({ locale, dictionary, params }: { locale: Parameters<typeof EditListingScreen>[0]["locale"]; dictionary: Parameters<typeof EditListingScreen>[0]["dictionary"]; params: Promise<{ locale: string; listingId: string }> }) { const { listingId } = await params; return <EditListingScreen locale={locale} dictionary={dictionary} listingId={listingId} />; }

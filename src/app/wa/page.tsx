import { redirect } from "next/navigation";

export default function WaRedirectPage() {
    const phoneNumber = "33652077203"; // Elisa's WhatsApp
    
    // Prefilled bilingual message
    const whatsappText = `Bonjour Elisa ! Je séjourne actuellement dans un hébergement partenaire autour d'Annecy et je souhaiterais profiter de l'offre privilège de 5% pour organiser des repas (chef à domicile / batch cooking / petit-déjeuner) durant mon séjour.

---

Hello Elisa! I am currently staying at a partner accommodation around Annecy and would love to take advantage of the 5% guest discount to organize meals (private chef / batch cooking / breakfast) during my stay.`;

    redirect(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(whatsappText)}`);
}

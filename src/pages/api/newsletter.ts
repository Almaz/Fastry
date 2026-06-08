// import type { APIRoute } from 'astro';
// import { z } from 'astro/zod';
// import { Resend } from 'resend';

// export const prerender = false;

// type Locale = 'en' | 'ru';

// const localeMessages: Record<string, Record<string, string>> = {
//   en: {
//     'Please enter a valid email address': 'Please enter a valid email address',
//     'Newsletter service is not configured.': 'Newsletter service is not configured.',
//     'Subscription failed. Please try again.': 'Subscription failed. Please try again.',
//   },
//   ru: {
//     'Please enter a valid email address': 'Пожалуйста, введите корректный email-адрес',
//     'Newsletter service is not configured.': 'Сервис рассылки не настроен.',
//     'Subscription failed. Please try again.': 'Не удалось подписаться. Пожалуйста, попробуйте снова.',
//   },
// };

// function t(key: string, locale: Locale): string {
//   return localeMessages[locale]?.[key] || localeMessages.en?.[key] || key;
// }

// function getLocale(formData: FormData): Locale {
//   const raw = formData.get('locale')?.toString();
//   return raw === 'ru' ? 'ru' : 'en';
// }

// const newsletterSchema = z.object({
//   email: z.email('Please enter a valid email address'),
//   honeypot: z.string().max(0).optional(),
// });

// export const POST: APIRoute = async ({ request }) => {
//   try {
//     const formData = await request.formData();
//     const email = formData.get('email')?.toString() || '';
//     const honeypot = formData.get('website')?.toString() || '';

//     // Check honeypot - if filled, it's likely a bot
//     if (honeypot) {
//       return new Response(JSON.stringify({ success: true }), {
//         status: 200,
//         headers: { 'Content-Type': 'application/json' },
//       });
//     }

//     const result = newsletterSchema.safeParse({ email, honeypot });

//     if (!result.success) {
//       return new Response(
//         JSON.stringify({
//           success: false,

//           error: result.error.issues[0]?.message || t('Please enter a valid email address', getLocale(formData)),
//         }),
//         {
//           status: 400,
//           headers: { 'Content-Type': 'application/json' },
//         }
//       );
//     }

//     const apiKey = import.meta.env.RESEND_API_KEY;
//     const audienceId = import.meta.env.RESEND_AUDIENCE_ID;

//     if (!apiKey || !audienceId) {
//       console.error('Newsletter: RESEND_API_KEY or RESEND_AUDIENCE_ID is not configured');
//       return new Response(
//         JSON.stringify({
//           success: false,
//           error: t('Newsletter service is not configured.', getLocale(formData)),
//         }),
//         {
//           status: 500,
//           headers: { 'Content-Type': 'application/json' },
//         }
//       );
//     }

//     const resend = new Resend(apiKey);
//     const { error } = await resend.contacts.create({
//       audienceId,
//       email: result.data.email,
//       unsubscribed: false,
//     });

//     if (error) {
//       console.error('Resend newsletter error:', error);
//       return new Response(
//         JSON.stringify({
//           success: false,
//           error: t('Subscription failed. Please try again.', getLocale(formData)),
//         }),
//         {
//           status: 500,
//           headers: { 'Content-Type': 'application/json' },
//         }
//       );
//     }

//     return new Response(JSON.stringify({ success: true }), {
//       status: 200,
//       headers: { 'Content-Type': 'application/json' },
//     });
//   } catch (error) {
//     console.error('Newsletter error:', error);

//     return new Response(
//       JSON.stringify({
//         success: false,
//         error: t('Subscription failed. Please try again.', 'en'),
//       }),
//       {
//         status: 500,
//         headers: { 'Content-Type': 'application/json' },
//       }
//     );
//   }
// };

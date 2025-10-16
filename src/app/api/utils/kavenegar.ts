export async function sendOtpKavenegar(receptor: string, otp: string): Promise<boolean> {
  const apiKey = process.env.KAVENEGAR_API_KEY || process.env.SMS_API_KEY;
  if (!apiKey) return false;
  const { default: kavenegar } = await import('kavenegar');
  const api = kavenegar.KavenegarApi({ apikey: apiKey });
  const sender = process.env.KAVENEGAR_SENDER_NUMBER || process.env.KAVENEGAR_SENDER || '2000660110';
  let r = receptor;
  if (r.startsWith('+98')) r = '0' + r.slice(3);
  else if (r.startsWith('98')) r = '0' + r.slice(2);
  const message = `کد تایید شما: ${otp}`;
  return new Promise((resolve, reject) => {
    api.Send({ message, sender, receptor: r }, (response: any, status: number) => {
      if (status === 200) resolve(true);
      else reject(new Error(`Kavenegar failed: ${status}`));
    });
  });
}



export const asyncSleep = (t: any) => new Promise(resolve => setTimeout(resolve, t));

export function is_num(id: any) {
    return (/^\d+$/.test(id));
}

export function checkEmail(email: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export function checkPassword(password: string) {
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])(?=.{8,})/.test(password)
}

import type { FormAnswers } from '../types/form'

/**
 * ข้อมูลสมมติสำหรับปุ่ม "ดูตัวอย่างเอกสาร" — บุคคลในตัวอย่างไม่มีอยู่จริง
 * ตั้งใจเว้นบางช่อง (เช่น เลขบัตรประชาชน) ให้เห็นว่าข้อที่ข้ามจะเป็นเส้นเขียนด้วยมือ
 */
export const SAMPLE_ANSWERS: FormAnswers = {
  fullName: 'สมศรี ใจดี (ตัวอย่าง)',
  birthDate: '14 กุมภาพันธ์ 2498',
  address: '123/45 หมู่ 6 ตำบลสุขใจ อำเภอเมือง จังหวัดเชียงใหม่ 50000',
  phone: '081-234-5678',
  medicalNotes: 'ความดันโลหิตสูง เบาหวานชนิดที่ 2\nแพ้ยาเพนิซิลลิน',

  qualityOfLife: {
    values: ['communicate', 'painFree', 'atHome'],
    other: 'ได้เห็นหลานเรียนจบ',
  },
  fears:
    'กลัวเป็นภาระของลูกหลาน และกลัวการยื้อชีวิตที่ทำให้ทรมานทั้งตัวเองและครอบครัว',
  unacceptableLine: 'จำหน้าลูกหลานไม่ได้ และช่วยเหลือตัวเองไม่ได้เลย',

  cpr: { value: 'decline' },
  ventilator: { value: 'decline' },
  tubeFeeding: { value: 'proxy' },
  dialysis: { value: 'decline' },
  antibiotics: { value: 'proxy' },
  tracheostomy: { value: 'decline' },
  otherProlonging: { value: 'decline' },

  painControl: { value: 'fullRelief' },
  carePlace: { value: 'home' },
  comfortEnvironment: 'เสียงธรรมะเบา ๆ กลิ่นดอกมะลิ และมีลูกหลานอยู่ใกล้ ๆ',
  spiritualPractice: 'ฟังบทสวดมนต์ และนิมนต์พระมาให้ศีลให้พรตามโอกาส',

  proxy1: {
    name: 'สมชาย ใจดี',
    relation: 'ลูกชาย',
    phone: '089-876-5432',
    phone2: '',
    lineId: 'somchai_jd',
    facebook: '',
    email: 'somchai@example.com',
    otherContact: '',
  },
  proxy2: {
    name: 'สมหญิง ใจดี',
    relation: 'ลูกสาว',
    phone: '086-111-2222',
    phone2: '',
    lineId: '',
    facebook: '',
    email: '',
    otherContact: '',
  },
  proxyScope: { value: 'followDocument' },
  proxyDiscussed: true,

  organDonation: { value: 'registered', detail: 'สภากาชาดไทย' },
  bodyDonation: { value: 'decline' },
  funeralStyle: 'พิธีทางพุทธศาสนา สวดอภิธรรม 3 คืน จัดเรียบง่ายที่วัดใกล้บ้าน',
  funeralWishes:
    'ใช้รูปที่ถ่ายกับครอบครัวตอนไปเที่ยวทะเล อยากให้มีดอกมะลิ ไม่ต้องการพวงหรีดฟุ่มเฟือย',
  documentsLocation:
    'พินัยกรรมและกรมธรรม์อยู่ในลิ้นชักโต๊ะทำงาน สมุดบัญชีอยู่ที่ตู้เซฟ (ลูกชายทราบรหัส)',

  messageToLoved:
    'ขอบคุณทุกคนที่เป็นครอบครัวที่อบอุ่นให้แม่เสมอมา แม่ภูมิใจในตัวลูกทุกคน ขอให้รักกันดูแลกันแบบนี้ตลอดไป อย่าเศร้านานนะลูก แม่มีความสุขมากแล้วในชีวิตนี้',
  gratitudeMessage:
    'ขอบคุณพ่อของลูก ๆ ที่ร่วมทุกข์ร่วมสุขกันมา 40 ปี และขอโทษป้าน้อยเรื่องที่เคยผิดใจกัน แม่ให้อภัยทุกคนที่เคยขัดใจกันนะ',
  otherMessage:
    'อยากให้ลูกหลานปลูกต้นไม้ที่บ้านสวนต่อ และแบ่งผลไม้ให้เพื่อนบ้านเหมือนที่แม่ทำมาตลอด',
}

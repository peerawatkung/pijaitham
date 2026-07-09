/**
 * นิยามคำถามทั้งหมดของฟอร์ม — single source of truth
 * สร้างจาก acp-booklet-structure.md (ฉบับร่าง v0.1)
 *
 * ห้าม hardcode ข้อความคำถามในคอมโพเนนต์ — แก้เนื้อหาที่ไฟล์นี้ที่เดียว
 * ค่า value ของตัวเลือกเป็นรหัสภาษาอังกฤษ (คงที่) ส่วน label คือข้อความที่แสดง
 */

export interface ChoiceOption {
  value: string
  label: string
  /** เมื่อเลือกตัวเลือกนี้ ให้แสดงช่องกรอกรายละเอียดเพิ่ม เช่น "ลงทะเบียนไว้กับ..." */
  detail?: {
    label: string
    placeholder?: string
  }
}

interface FieldBase {
  id: string
  label: string
  /** คำอธิบายสั้น ๆ ใต้คำถาม — น้ำเสียงนุ่ม ชวนคิด */
  hint?: string
  placeholder?: string
  required?: boolean
  /** แสดงเฉพาะบนเว็บ ไม่พิมพ์เป็นคำถามลง PDF (เช่น ตัวเลือกการใช้งาน) */
  webOnly?: boolean
  /** ซ่อน field นี้ (และเว้นว่างใน PDF ให้เขียนด้วยปากกา) เมื่อ checkbox ที่ระบุถูกติ๊ก */
  hiddenWhenChecked?: string
}

export type FieldDef =
  | (FieldBase & { type: 'text' })
  | (FieldBase & { type: 'textarea'; rows?: number })
  | (FieldBase & { type: 'choice'; options: ChoiceOption[] })
  | (FieldBase & {
      type: 'multichoice'
      options: ChoiceOption[]
      allowOther?: boolean
      otherPlaceholder?: string
    })
  | (FieldBase & { type: 'person' })
  | (FieldBase & { type: 'checkbox' })

export interface SectionDef {
  id: string
  number: number
  title: string
  /** ชื่อย่อสำหรับ progress indicator */
  shortTitle: string
  /** ประโยคเกริ่นว่าทำไมส่วนนี้มีความหมาย */
  intro: string
  /** ข้อความเงื่อนไขนำ (ใช้ในส่วนที่ 3) — ต้องแสดงเด่นชัดทั้งบนเว็บและใน PDF */
  preamble?: string
  /** หมายเหตุท้ายส่วน */
  footnote?: string
  fields: FieldDef[]
}

/** ตัวเลือกมาตรฐานของหัวข้อการรักษาในส่วนที่ 3 */
const TREATMENT_OPTIONS: ChoiceOption[] = [
  { value: 'want', label: 'ต้องการ' },
  { value: 'decline', label: 'ไม่ต้องการ' },
  { value: 'proxy', label: 'ให้ผู้ตัดสินใจแทนพิจารณา' },
  { value: 'unspecified', label: 'ยังไม่ระบุ' },
]

export const SECTIONS: SectionDef[] = [
  {
    id: 'about-me',
    number: 1,
    title: 'ข้อมูลของฉัน',
    shortTitle: 'ข้อมูลของฉัน',
    intro:
      'ข้อมูลพื้นฐานเหล่านี้ช่วยให้เอกสารอ้างอิงถึงตัวคุณได้จริง เมื่อถึงเวลาที่ต้องใช้ ครอบครัวและทีมแพทย์จะได้มั่นใจว่านี่คือเจตนาของคุณ',
    fields: [
      {
        type: 'checkbox',
        id: 'handwritePersonal',
        label: 'ฉันต้องการปริ้นเอกสารไปเขียนข้อมูลส่วนตัวด้วยปากกาเอง',
        hint: 'ติ๊กข้อนี้ได้ถ้าไม่สะดวกพิมพ์ข้อมูลส่วนตัวลงในเว็บ — ช่องกรอกด้านล่างจะถูกซ่อน และในเอกสารจะมีเส้นเว้นว่างให้เขียนด้วยมือ',
        webOnly: true,
      },
      {
        type: 'text',
        id: 'fullName',
        label: 'ชื่อ-นามสกุล',
        required: true,
        placeholder: 'เช่น สมศรี ใจดี',
        hiddenWhenChecked: 'handwritePersonal',
      },
      {
        type: 'text',
        id: 'birthDate',
        label: 'วัน/เดือน/ปีเกิด (พ.ศ.)',
        placeholder: 'เช่น 14 กุมภาพันธ์ 2498 หรือ 14/02/2498',
        hiddenWhenChecked: 'handwritePersonal',
      },
      {
        type: 'text',
        id: 'nationalId',
        label: 'เลขบัตรประชาชน',
        hint: 'จำเป็นสำหรับให้เอกสารอ้างอิงตัวบุคคลได้ — หากไม่สะดวกพิมพ์ในเว็บ เว้นไว้แล้วเขียนด้วยมือหลังปริ้นได้',
        placeholder: 'x-xxxx-xxxxx-xx-x',
        hiddenWhenChecked: 'handwritePersonal',
      },
      {
        type: 'textarea',
        id: 'address',
        label: 'ที่อยู่',
        rows: 2,
        hiddenWhenChecked: 'handwritePersonal',
      },
      {
        type: 'text',
        id: 'phone',
        label: 'เบอร์ติดต่อ',
        hiddenWhenChecked: 'handwritePersonal',
      },
      {
        type: 'textarea',
        id: 'medicalNotes',
        label: 'โรคประจำตัว / ยาที่แพ้',
        hint: 'ข้อมูลนี้ช่วยทีมแพทย์ดูแลคุณได้ปลอดภัยขึ้น',
        rows: 3,
        hiddenWhenChecked: 'handwritePersonal',
      },
    ],
  },
  {
    id: 'my-values',
    number: 2,
    title: 'สิ่งที่ฉันให้คุณค่า',
    shortTitle: 'คุณค่าของฉัน',
    intro:
      'ก่อนจะพูดถึงการรักษา อยากชวนคุณทบทวนว่าอะไรทำให้ชีวิตมีความหมายสำหรับคุณ คำตอบในส่วนนี้จะช่วยให้ครอบครัวและแพทย์เข้าใจ "เหตุผล" เบื้องหลังทุกการตัดสินใจของคุณ',
    fields: [
      {
        type: 'multichoice',
        id: 'qualityOfLife',
        label: 'สำหรับฉัน ชีวิตที่มีคุณภาพหมายถึงอะไร',
        hint: 'เลือกได้หลายข้อ และเขียนเพิ่มเติมในแบบของคุณเองได้',
        options: [
          { value: 'communicate', label: 'สื่อสารกับคนรอบข้างได้' },
          { value: 'independent', label: 'ช่วยเหลือตัวเองได้ ไม่เป็นภาระ' },
          { value: 'painFree', label: 'ไม่เจ็บปวดทรมาน' },
          { value: 'atHome', label: 'ได้อยู่บ้าน อยู่กับครอบครัว' },
          { value: 'conscious', label: 'มีสติรับรู้ ตัดสินใจเองได้' },
        ],
        allowOther: true,
        otherPlaceholder: 'สิ่งอื่นที่มีความหมายกับฉัน...',
      },
      {
        type: 'textarea',
        id: 'fears',
        label: 'สิ่งที่ฉันกลัวหรือกังวลมากที่สุดเกี่ยวกับช่วงท้ายของชีวิต',
        hint: 'เช่น "กลัวเป็นภาระของลูกหลาน และกลัวการยื้อชีวิตที่ทำให้ทรมานทั้งตัวเองและครอบครัว" หรือความกังวลอื่น เช่น ความเจ็บปวด การจากไปโดยไม่ได้บอกลา ค่าใช้จ่ายของครอบครัว',
        rows: 4,
      },
      {
        type: 'textarea',
        id: 'unacceptableLine',
        label: 'ถ้าฉันไม่สามารถ __________ ได้อีกต่อไป ฉันถือว่านั่นคือจุดที่ยอมรับได้ยาก',
        hint: 'เติมในช่องว่าง เช่น "จำหน้าคนที่รักได้" หรือ "กินอาหารเองได้"',
        rows: 2,
      },
    ],
  },
  {
    id: 'end-of-life-care',
    number: 3,
    title: 'การรักษาในวาระสุดท้ายของชีวิต',
    shortTitle: 'การรักษา',
    intro:
      'ส่วนนี้คือหัวใจของเอกสารตามมาตรา 12 พ.ร.บ.สุขภาพแห่งชาติ — โอกาสที่คุณจะบอกล่วงหน้าว่า ในวาระสุดท้าย คุณต้องการหรือไม่ต้องการการรักษาแบบใด',
    preamble:
      'เจตนาในส่วนนี้ให้มีผลเฉพาะเมื่อแพทย์วินิจฉัยว่าข้าพเจ้าอยู่ในวาระสุดท้ายของชีวิต และไม่มีทางรักษาให้หายได้แล้วเท่านั้น',
    footnote:
      'การปฏิเสธการรักษาข้างต้นไม่ใช่การปฏิเสธการดูแล — คุณจะยังได้รับการดูแลแบบประคับประคองอย่างเต็มที่ เพื่อความสบายกายและใจ',
    fields: [
      {
        type: 'choice',
        id: 'cpr',
        label: 'การกู้ชีพเมื่อหัวใจหยุดเต้น (CPR)',
        options: TREATMENT_OPTIONS,
      },
      {
        type: 'choice',
        id: 'ventilator',
        label: 'การใส่ท่อและเครื่องช่วยหายใจ',
        options: TREATMENT_OPTIONS,
      },
      {
        type: 'choice',
        id: 'tubeFeeding',
        label: 'การให้อาหารทางสายยาง',
        options: TREATMENT_OPTIONS,
      },
      {
        type: 'choice',
        id: 'dialysis',
        label: 'การฟอกไต',
        options: TREATMENT_OPTIONS,
      },
      {
        type: 'choice',
        id: 'antibiotics',
        label: 'การให้ยาปฏิชีวนะเพื่อยื้อชีวิต',
        hint: 'กรณีติดเชื้อรุนแรงในวาระสุดท้าย',
        options: TREATMENT_OPTIONS,
      },
      {
        type: 'choice',
        id: 'tracheostomy',
        label: 'การเจาะคอ',
        options: TREATMENT_OPTIONS,
      },
      {
        type: 'choice',
        id: 'otherProlonging',
        label: 'การรักษาอื่น ๆ ที่เป็นเพียงการยื้อการตาย',
        options: TREATMENT_OPTIONS,
      },
    ],
  },
  {
    id: 'palliative-care',
    number: 4,
    title: 'การดูแลแบบประคับประคอง',
    shortTitle: 'ความสบายของฉัน',
    intro:
      'การดูแลแบบประคับประคอง (Palliative Care) คือการดูแลให้คุณสบายที่สุดทั้งกายและใจ ส่วนนี้ช่วยบอกทีมผู้ดูแลว่า "ความสบาย" ในแบบของคุณเป็นอย่างไร',
    fields: [
      {
        type: 'choice',
        id: 'painControl',
        label: 'เรื่องความเจ็บปวด ฉันต้องการแบบไหน',
        options: [
          {
            value: 'fullRelief',
            label: 'ต้องการยาระงับปวดเต็มที่ แม้อาจทำให้ง่วงซึม',
          },
          {
            value: 'stayAlert',
            label: 'ต้องการคงสติรับรู้ไว้มากที่สุด แม้อาจเจ็บบ้าง',
          },
          { value: 'doctorDecide', label: 'ให้แพทย์พิจารณาตามความเหมาะสม' },
        ],
      },
      {
        type: 'choice',
        id: 'carePlace',
        label: 'สถานที่ที่อยากได้รับการดูแลในช่วงท้าย',
        options: [
          { value: 'home', label: 'บ้าน' },
          { value: 'hospital', label: 'โรงพยาบาล' },
          { value: 'hospice', label: 'สถานดูแลผู้ป่วยระยะท้าย' },
          { value: 'familyConvenient', label: 'ที่ไหนก็ได้ที่ครอบครัวสะดวก' },
        ],
      },
      {
        type: 'textarea',
        id: 'comfortEnvironment',
        label: 'สิ่งแวดล้อมที่ทำให้ฉันสบายใจ',
        hint: 'เช่น "อยากฟังเพลงเบา ๆ ที่เคยชอบ มีรูปครอบครัววางข้างเตียง และมีลูกหลานอยู่ใกล้ ๆ"',
        rows: 3,
      },
      {
        type: 'textarea',
        id: 'spiritualPractice',
        label: 'การปฏิบัติทางศาสนา/จิตวิญญาณที่ต้องการ',
        hint: 'เช่น "อยากฟังบทสวดมนต์เบา ๆ และนิมนต์พระมาให้ศีลให้พรตามโอกาส" หรือพิธีตามศาสนาที่นับถือ',
        rows: 3,
      },
    ],
  },
  {
    id: 'my-proxy',
    number: 5,
    title: 'ผู้ตัดสินใจแทนฉัน',
    shortTitle: 'ผู้ตัดสินใจแทน',
    intro:
      'หากถึงวันที่คุณสื่อสารเองไม่ได้ ใครคือคนที่คุณไว้วางใจให้พูดแทนใจคุณ การระบุไว้ล่วงหน้าช่วยให้คนคนนั้นทำหน้าที่ได้อย่างมั่นใจ และครอบครัวไม่ต้องเดา',
    fields: [
      {
        type: 'person',
        id: 'proxy1',
        label: 'ผู้ตัดสินใจแทนคนที่ 1',
      },
      {
        type: 'person',
        id: 'proxy2',
        label: 'ผู้ตัดสินใจแทนคนที่ 2 (สำรอง)',
        hint: 'เผื่อกรณีคนที่ 1 ติดต่อไม่ได้ในเวลานั้น',
      },
      {
        type: 'choice',
        id: 'proxyScope',
        label: 'ขอบเขตการตัดสินใจที่ฉันมอบให้',
        options: [
          {
            value: 'followDocument',
            label: 'ให้ตัดสินใจตามที่เขียนไว้ในเอกสารนี้',
          },
          {
            value: 'useJudgment',
            label: 'ให้ใช้ดุลยพินิจได้ในเรื่องที่เอกสารไม่ครอบคลุม',
          },
        ],
      },
      {
        type: 'checkbox',
        id: 'proxyDiscussed',
        label: 'ฉันได้พูดคุยกับบุคคลนี้แล้ว และเขายินยอมรับหน้าที่',
        hint: 'การพูดคุยล่วงหน้าสำคัญมาก — ช่วยให้เขาพร้อมทำหน้าที่นี้ในวันที่จำเป็น',
      },
    ],
  },
  {
    id: 'after-i-go',
    number: 6,
    title: 'หลังจากฉันจากไป',
    shortTitle: 'หลังจากนั้น',
    intro:
      'การบอกความต้องการไว้ล่วงหน้า คือของขวัญที่ช่วยลดภาระการตัดสินใจของครอบครัวในช่วงเวลาที่ยากที่สุดของพวกเขา',
    fields: [
      {
        type: 'choice',
        id: 'organDonation',
        label: 'การบริจาคอวัยวะ',
        hint: 'หากประสงค์บริจาค ลงทะเบียนล่วงหน้าได้ที่ศูนย์รับบริจาคอวัยวะ สภากาชาดไทย — organdonate.redcross.or.th',
        options: [
          { value: 'wish', label: 'ประสงค์บริจาค' },
          { value: 'decline', label: 'ไม่ประสงค์' },
          {
            value: 'registered',
            label: 'ลงทะเบียนไว้แล้ว',
            detail: {
              label: 'ลงทะเบียนไว้กับ',
              placeholder: 'เช่น สภากาชาดไทย',
            },
          },
        ],
      },
      {
        type: 'choice',
        id: 'bodyDonation',
        label: 'การบริจาคร่างกายเพื่อการศึกษา',
        hint: 'การอุทิศร่างกายเป็น "อาจารย์ใหญ่" ลงทะเบียนได้ที่คณะแพทยศาสตร์ของโรงเรียนแพทย์ต่าง ๆ ด้วยตนเองหรือผ่านเว็บไซต์ของหน่วยงาน — เช่น โรงพยาบาลจุฬาลงกรณ์ สภากาชาดไทย, คณะแพทยศาสตร์ศิริราชพยาบาล, คณะแพทยศาสตร์โรงพยาบาลรามาธิบดี',
        options: [
          { value: 'wish', label: 'ประสงค์บริจาค' },
          { value: 'decline', label: 'ไม่ประสงค์' },
          {
            value: 'registered',
            label: 'ลงทะเบียนไว้แล้ว',
            detail: {
              label: 'ลงทะเบียนไว้กับ',
              placeholder: 'เช่น โรงพยาบาล/คณะแพทยศาสตร์',
            },
          },
        ],
      },
      {
        type: 'textarea',
        id: 'funeralStyle',
        label: 'รูปแบบพิธีที่ต้องการ',
        hint: 'เช่น "พิธีทางพุทธศาสนา สวดอภิธรรม 3 คืน จัดเรียบง่ายที่วัดใกล้บ้าน"',
        rows: 3,
      },
      {
        type: 'textarea',
        id: 'funeralWishes',
        label: 'สิ่งที่อยากให้มี / ไม่อยากให้มีในงาน',
        hint: 'เช่น "ใช้รูปที่ถ่ายกับครอบครัวตอนไปเที่ยวด้วยกัน อยากให้มีดอกมะลิ ไม่ต้องการพวงหรีดฟุ่มเฟือย"',
        rows: 3,
      },
      {
        type: 'textarea',
        id: 'documentsLocation',
        label: 'เอกสารสำคัญเก็บไว้ที่ไหน',
        hint: 'ระบุเพียงที่เก็บ ไม่ต้องใส่รายละเอียดเอกสารในนี้ — เช่น "พินัยกรรมและกรมธรรม์อยู่ในลิ้นชักโต๊ะทำงาน สมุดบัญชีอยู่ที่ตู้เซฟ (ลูกชายทราบรหัส)"',
        rows: 3,
      },
    ],
  },
  {
    id: 'from-my-heart',
    number: 7,
    title: 'ข้อความจากใจ',
    shortTitle: 'ข้อความจากใจ',
    intro:
      'พื้นที่นี้เป็นของคุณทั้งหมด — หลายคนบอกว่านี่คือหน้าที่มีคุณค่าทางใจที่สุดของเอกสารทั้งฉบับ เขียนในแบบของคุณ ไม่มีถูกหรือผิด',
    fields: [
      {
        type: 'textarea',
        id: 'messageToLoved',
        label: 'ข้อความถึงครอบครัว / คนที่รัก',
        hint: 'เช่น สิ่งที่อยากให้ครอบครัวจดจำ ความหวังที่มีต่อลูกหลาน หรือคำอวยพรที่อยากฝากไว้ให้กัน',
        rows: 6,
      },
      {
        type: 'textarea',
        id: 'gratitudeMessage',
        label: 'สิ่งที่อยากขอบคุณ / ขอโทษ / ให้อภัย',
        hint: 'เช่น ขอบคุณใครสักคนที่ดูแลกันมาตลอด ขอโทษในเรื่องที่ยังค้างคาใจ หรือบอกใครสักคนว่าให้อภัยแล้ว',
        rows: 5,
      },
      {
        type: 'textarea',
        id: 'otherMessage',
        label: 'สิ่งอื่นใดที่อยากบอก',
        hint: 'เช่น เรื่องราวที่อยากเล่าให้ฟัง บทเรียนชีวิตที่อยากส่งต่อ หรือความปรารถนาที่ยังไม่ได้บอกในข้อก่อนหน้า',
        rows: 4,
      },
    ],
  },
]

/** จำนวนขั้นทั้งหมดใน wizard (ส่วนที่ 8 การลงนามอยู่ใน PDF เท่านั้น) */
export const TOTAL_STEPS = SECTIONS.length

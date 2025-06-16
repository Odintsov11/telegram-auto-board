import { z } from 'zod'

export const carFormSchema = z.object({
  brand: z.string().min(1, 'Выберите марку автомобиля'),
  model: z.string().min(1, 'Выберите модель автомобиля'),
  year: z.string().min(1, 'Выберите год выпуска'),
  engineType: z.string().min(1, 'Выберите тип двигателя'),
  engineVolume: z.number().min(0.1, 'Объем двигателя должен быть больше 0').max(10, 'Объем двигателя не может быть больше 10л'),
  mileage: z.number().min(0, 'Пробег не может быть отрицательным'),
  transmission: z.string().min(1, 'Выберите тип коробки передач'),
  drive: z.string().min(1, 'Выберите тип привода'),
  description: z.string().min(10, 'Описание должно содержать минимум 10 символов'),
  city: z.string().min(1, 'Выберите город'),
  price: z.number().min(1, 'Цена должна быть больше 0'),
  riaPrice: z.number().optional(),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Неверный формат телефона'),
  username: z.string().regex(/^@[a-zA-Z0-9_]{5,}$/, 'Username должен начинаться с @ и содержать минимум 5 символов'),
})

export type CarFormData = z.infer<typeof carFormSchema>

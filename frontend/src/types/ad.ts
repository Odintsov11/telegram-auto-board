export interface Ad {
  id: number
  userId: number
  carBrand: string
  carModel: string
  carYear: string
  engineType: string
  engineVolume: number
  mileage: number
  transmission: string
  drive: string
  description: string
  city: string
  price: number
  riaPrice?: number
  contactPhone: string
  contactUsername: string
  status: 'ACTIVE' | 'INACTIVE' | 'DELETED'
  viewsCount: number
  channelMessageId?: number
  createdAt: string
  updatedAt: string
  publishedAt?: string
}

export interface CreateAdData {
  carBrand: string
  carModel: string
  carYear: string
  engineType: string
  engineVolume: number
  mileage: number
  transmission: string
  drive: string
  description: string
  city: string
  price: number
  riaPrice?: number
  contactPhone: string
  contactUsername: string
  photos: string[]
}
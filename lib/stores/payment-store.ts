"use client"

import { create } from "zustand"
import { devtools } from "zustand/middleware"
import type { PaymentSlice } from "./slices/payment-slice"
import { createPaymentSlice } from "./slices/payment-slice"

export const usePaymentStore = create<PaymentSlice>()(devtools(createPaymentSlice, { name: "payment-store" }))

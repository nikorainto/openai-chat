import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { MODELS } from '@/utils/constants'

type Model = {
  name: string
  isSelected: boolean
}

type ModelsState = {
  models: Model[]
  updateModelSelection: (modelName: string) => void
}

export const useModelStore = create<ModelsState>()(
  persist(
    (set, get) => ({
      models: [
        { name: MODELS.gpt3, isSelected: false },
        { name: MODELS.gpt4, isSelected: false },
        { name: MODELS.gpt41, isSelected: true },
      ],
      updateModelSelection: (modelName) =>
        set({
          models: get().models.map((model) => ({
            ...model,
            isSelected: model.name === modelName,
          })),
        }),
    }),
    {
      name: 'models',
    },
  ),
)

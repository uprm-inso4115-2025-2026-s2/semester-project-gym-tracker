export interface GoalsFeedback { 
    id: string
    user_id: string                                                             
    type: string
    title: string                                                               
    description: string | null
    target_value: number
    recorded_value: number
    status: string                                                              
    period_date: string
    created_at: string                                                          
    updated_at: string                                                          
  }
                                                                                
  export type GoalsFeedbackInsert = Omit<GoalsFeedback, 'id' | 'created_at' | 'updated_at'>
  export type GoalsFeedbackUpdate = Partial<GoalsFeedbackInsert>     

  //ts manually done, this is in case we need to use it outside of the notifications context or if supabase tables are lost
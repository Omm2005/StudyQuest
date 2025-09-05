import QueryComponent from '@/components/QueryComponent'
import { auth } from '@/server/auth'
import LoginComponent from '@/components/LoginComponent'
import React from 'react'

type Props = {}

const Page = async(props: Props) => {
  const session = await auth()
  if(!session) {
    return <LoginComponent />
  }
  return (
    <QueryComponent />
  )
}

export default Page
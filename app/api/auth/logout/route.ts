import { NextResponse } from 'next/server'
export async function POST() {
  const res = NextResponse.json({ success: true })
  res.cookies.delete('rb-session')
  res.cookies.delete('rb-refresh')
  return res
}

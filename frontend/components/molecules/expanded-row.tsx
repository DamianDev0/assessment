"use client"

import type { ReactNode } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { TableCell, TableRow } from "@/components/shadcn/table"

interface ExpandedRowProps {
  isExpanded: boolean
  colSpan: number
  children: ReactNode
}

export function ExpandedRow({ isExpanded, colSpan, children }: Readonly<ExpandedRowProps>) {
  return (
    <AnimatePresence>
      {isExpanded ? (
        <TableRow className="bg-muted/30 hover:bg-muted/30">
          <TableCell colSpan={colSpan} className="p-0">
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="p-4">{children}</div>
            </motion.div>
          </TableCell>
        </TableRow>
      ) : null}
    </AnimatePresence>
  )
}

import React from "react"
import "@testing-library/jest-dom"
import { render, screen, act } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import PasswordInput from "../password-input"

describe("PasswordInput", () => {
  test("toggles visibility when eye button is clicked", async () => {
    const user = userEvent.setup()
    render(<PasswordInput placeholder="pw" value="secret" onChange={() => {}} />)

    const input = screen.getByPlaceholderText("pw")
    // initially should be type password => masked
    expect(input).toHaveAttribute("type", "password")

    const btn = screen.getByRole("button")
    await act(async () => {
      await user.click(btn)
    })
    // now should be visible
    expect(input).toHaveAttribute("type", "text")

    await act(async () => {
      await user.click(btn)
    })
    expect(input).toHaveAttribute("type", "password")
  })

  test("shows strength meter and updates with input value", async () => {
    const user = userEvent.setup()
  render(<PasswordInput placeholder="pw2" defaultValue="" showStrength />)

    // The strength progress bar inner element is rendered (via data-testid)
    const inner = screen.getByTestId("password-strength-bar")
    expect(inner).toBeInTheDocument()

    // Simulate typing into the input element and wrap in act
    const input = screen.getByPlaceholderText("pw2")
    await act(async () => {
      await user.type(input, "Abc123!@#")
    })

    // click the visibility toggle and ensure typed value is present (wrapped)
    const btn = screen.getByRole("button")
    await act(async () => {
      await user.click(btn)
    })
    expect(input).toHaveValue("Abc123!@#")
  })
})

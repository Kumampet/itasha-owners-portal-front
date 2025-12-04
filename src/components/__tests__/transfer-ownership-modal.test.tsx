import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TransferOwnershipModal } from '../transfer-ownership-modal'

describe('TransferOwnershipModal', () => {
  const mockMembers = [
    {
      id: 'user-1',
      name: 'ユーザー1',
      displayName: 'ユーザー1表示名',
    },
    {
      id: 'user-2',
      name: 'ユーザー2',
      displayName: 'ユーザー2表示名',
    },
    {
      id: 'user-3',
      name: null,
      displayName: null,
    },
  ]

  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    onConfirm: jest.fn(),
    members: mockMembers,
    currentUserId: 'user-1',
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('モーダルが開いている場合、表示される', () => {
    render(<TransferOwnershipModal {...defaultProps} />)
    expect(screen.getByText('オーナー権限を譲渡')).toBeInTheDocument()
  })

  it('モーダルが閉じている場合、表示されない', () => {
    render(<TransferOwnershipModal {...defaultProps} isOpen={false} />)
    expect(screen.queryByText('オーナー権限を譲渡')).not.toBeInTheDocument()
  })

  it('説明文を表示する', () => {
    render(<TransferOwnershipModal {...defaultProps} />)
    expect(
      screen.getByText('本当に団体オーナー権限を譲渡しますか？')
    ).toBeInTheDocument()
    expect(
      screen.getByText(/権限の譲渡はメンバー間で合意の上/)
    ).toBeInTheDocument()
  })

  it('現在のユーザーを除外してメンバーリストを表示する', () => {
    render(<TransferOwnershipModal {...defaultProps} />)
    
    const select = screen.getByRole('combobox')
    const options = Array.from(select.querySelectorAll('option'))
    
    // 現在のユーザー（user-1）は除外される
    expect(options.find(opt => opt.value === 'user-1')).toBeUndefined()
    expect(options.find(opt => opt.value === 'user-2')).toBeDefined()
    expect(options.find(opt => opt.value === 'user-3')).toBeDefined()
  })

  it('メンバーの表示名を表示する', () => {
    render(<TransferOwnershipModal {...defaultProps} />)
    
    const select = screen.getByRole('combobox')
    expect(select).toHaveTextContent('ユーザー2表示名')
  })

  it('表示名がない場合、名前を表示する', () => {
    const membersWithoutDisplayName = [
      {
        id: 'user-2',
        name: 'ユーザー2',
        displayName: null,
      },
    ]

    render(
      <TransferOwnershipModal
        {...defaultProps}
        members={membersWithoutDisplayName}
      />
    )

    const select = screen.getByRole('combobox')
    expect(select).toHaveTextContent('ユーザー2')
  })

  it('名前も表示名もない場合、"名前未設定"を表示する', () => {
    const membersWithoutName = [
      {
        id: 'user-3',
        name: null,
        displayName: null,
      },
    ]

    render(
      <TransferOwnershipModal
        {...defaultProps}
        members={membersWithoutName}
      />
    )

    const select = screen.getByRole('combobox')
    expect(select).toHaveTextContent('名前未設定')
  })

  it('メンバーを選択する', async () => {
    const user = userEvent.setup()
    render(<TransferOwnershipModal {...defaultProps} />)

    const select = screen.getByRole('combobox')
    await user.selectOptions(select, 'user-2')

    expect(select).toHaveValue('user-2')
  })

  it('メンバーが選択されていない場合、譲渡ボタンは無効', () => {
    render(<TransferOwnershipModal {...defaultProps} />)

    const confirmButton = screen.getByRole('button', { name: /譲渡する/i })
    expect(confirmButton).toBeDisabled()
  })

  it('メンバーが選択されている場合、譲渡ボタンは有効', async () => {
    const user = userEvent.setup()
    render(<TransferOwnershipModal {...defaultProps} />)

    const select = screen.getByRole('combobox')
    await user.selectOptions(select, 'user-2')

    const confirmButton = screen.getByRole('button', { name: /譲渡する/i })
    expect(confirmButton).not.toBeDisabled()
  })

  it('キャンセルボタンをクリックするとonCloseが呼ばれる', async () => {
    const onClose = jest.fn()
    const user = userEvent.setup()
    render(<TransferOwnershipModal {...defaultProps} onClose={onClose} />)

    const cancelButton = screen.getByRole('button', { name: /キャンセル/i })
    await user.click(cancelButton)

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('メンバーが選択されていない状態で譲渡ボタンをクリックしてもonConfirmが呼ばれない', () => {
    const onConfirm = jest.fn()
    render(<TransferOwnershipModal {...defaultProps} onConfirm={onConfirm} />)

    const confirmButton = screen.getByRole('button', { name: /譲渡する/i })
    // ボタンが無効なのでクリックできないが、念のため確認
    expect(confirmButton).toBeDisabled()
    expect(onConfirm).not.toHaveBeenCalled()
  })

  it('メンバーを選択して譲渡ボタンをクリックするとonConfirmが呼ばれる', async () => {
    const onConfirm = jest.fn()
    const user = userEvent.setup()
    render(<TransferOwnershipModal {...defaultProps} onConfirm={onConfirm} />)

    const select = screen.getByRole('combobox')
    await user.selectOptions(select, 'user-2')

    const confirmButton = screen.getByRole('button', { name: /譲渡する/i })
    await user.click(confirmButton)

    expect(onConfirm).toHaveBeenCalledWith('user-2')
  })

  it('譲渡後、選択がリセットされる', async () => {
    const onConfirm = jest.fn()
    const user = userEvent.setup()
    render(<TransferOwnershipModal {...defaultProps} onConfirm={onConfirm} />)

    const select = screen.getByRole('combobox')
    await user.selectOptions(select, 'user-2')

    const confirmButton = screen.getByRole('button', { name: /譲渡する/i })
    await user.click(confirmButton)

    // モーダルが閉じる前に選択がリセットされる
    expect(select).toHaveValue('')
  })

  it('メンバーが1人（現在のユーザーのみ）の場合、選択肢が空', () => {
    const singleMember = [
      {
        id: 'user-1',
        name: 'ユーザー1',
        displayName: 'ユーザー1表示名',
      },
    ]

    render(
      <TransferOwnershipModal
        {...defaultProps}
        members={singleMember}
        currentUserId="user-1"
      />
    )

    const select = screen.getByRole('combobox')
    const options = Array.from(select.querySelectorAll('option'))
    
    // 「選択してください」オプションのみ
    expect(options.length).toBe(1)
    expect(options[0].value).toBe('')
  })
})


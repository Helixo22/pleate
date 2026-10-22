"use client";

import { Button } from "pleate/button";
import { Input } from "pleate/input";
import { Label } from "pleate/label";
import { Modal, ModalBody, ModalClose, ModalContent, ModalDescription, ModalFooter, ModalHeader, ModalTitle, ModalTrigger } from "pleate/modal";

export default function Demo() {
  return (
    <>
      <Modal>
        <ModalTrigger asChild>
          <Button>New trip</Button>
        </ModalTrigger>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>New trip</ModalTitle>
            <ModalDescription>Give it a name. You can invite people later.</ModalDescription>
          </ModalHeader>
          <ModalBody className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="trip-name">Name</Label>
              <Input id="trip-name" placeholder="Weekend in Lisbon" autoFocus />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="trip-dates">Dates</Label>
              <Input id="trip-dates" placeholder="12 to 15 June" />
            </div>
          </ModalBody>
          <ModalFooter>
            <ModalClose asChild>
              <Button variant="gray" tone="neutral">Cancel</Button>
            </ModalClose>
            <ModalClose asChild>
              <Button>Create</Button>
            </ModalClose>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal>
        <ModalTrigger asChild>
          <Button variant="tinted">Long content</Button>
        </ModalTrigger>
        <ModalContent size="lg" mobile="center">
          <ModalHeader>
            <ModalTitle>Terms of travel</ModalTitle>
          </ModalHeader>
          <ModalBody className="grid gap-3 text-fg-muted">
            {Array.from({ length: 14 }, (_, i) => (
              <p key={i}>
                {i + 1}. Bookings are confirmed once every traveller has accepted the invitation. Prices are shown per
                person and include taxes; local fees may apply on arrival.
              </p>
            ))}
          </ModalBody>
          <ModalFooter>
            <ModalClose asChild>
              <Button>Accept</Button>
            </ModalClose>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}

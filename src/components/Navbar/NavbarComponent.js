import React, { useState } from "react";
import { Navbar, Nav, Container } from "react-bootstrap";
import logo from "../../images/icon48.png";
import "./NavbarComponent.css";
import RestoreSessionComponent from "../Pages/RestoreSession/RestoreSessionComponent";
import SaveTabsComponent from "../Pages/SaveTabs/SaveTabsComponent";
import AboutComponent from "../Pages/About/AboutComponent";
import TabGroupList from "../Pages/TabGroups/TabGroupList";
const NavbarComponent = () => {
  const [activeTab, setActiveTab] = useState("groups");

  return (
    <Container className="navbar">
      {/* Navbar */}
      <Navbar collapseOnSelect bg="light" expand="xs">
        <Container>
          <Navbar.Brand onClick={() => setActiveTab("home")} href="#home">
            <img src={logo} className="App-logo" alt="logo" />
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="me-auto">
              <Nav.Link
                href="#groups"
                active={activeTab === "groups"}
                onClick={() => setActiveTab("groups")}
              >
                My Groups
              </Nav.Link>
              <Nav.Link
                href="#legacy"
                active={activeTab === "legacy"}
                onClick={() => setActiveTab("legacy")}
              >
                Legacy
              </Nav.Link>
              <Nav.Link
                href="#about"
                active={activeTab === "about"}
                onClick={() => setActiveTab("about")}
              >
                About
              </Nav.Link>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      {/* Content */}
      <Container className="mt-4">
        {activeTab === "groups" && (
          <>
            <TabGroupList />
          </>
        )}
        {activeTab === "legacy" && (
          <>
            <h4>Legacy File-Based Operations</h4>
            <SaveTabsComponent />
            <hr className="my-4" />
            <RestoreSessionComponent />
          </>
        )}
        {activeTab === "about" && (
          <>
            <AboutComponent />
          </>
        )}
      </Container>
    </Container>
  );
};

export default NavbarComponent;
